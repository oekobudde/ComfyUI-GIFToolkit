import math
import torch
import torch.nn.functional as F


class WebexGIFPrepare:
    """Backward-compatible v2 helper: trim and build blink indexes."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "video_info": ("VHS_VIDEOINFO",),
                "max_duration_seconds": ("FLOAT", {"default": 6.0, "min": 0.0, "max": 60.0, "step": 0.1}),
                "blink_on_seconds": ("FLOAT", {"default": 0.5, "min": 0.05, "max": 10.0, "step": 0.05}),
                "blink_off_seconds": ("FLOAT", {"default": 0.5, "min": 0.05, "max": 10.0, "step": 0.05}),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING", "FLOAT", "INT", "FLOAT")
    RETURN_NAMES = ("images", "text_on_indexes", "fps", "frame_count", "duration_seconds")
    FUNCTION = "prepare"
    CATEGORY = "Webex GIF Tools"

    @staticmethod
    def _read_fps(video_info):
        if isinstance(video_info, dict):
            for key in ("loaded_fps", "source_fps"):
                value = video_info.get(key)
                try:
                    value = float(value)
                    if value > 0:
                        return value
                except (TypeError, ValueError):
                    pass
        return 8.0

    def prepare(self, images, video_info, max_duration_seconds=6.0, blink_on_seconds=0.5, blink_off_seconds=0.5):
        fps = self._read_fps(video_info)
        total_frames = int(len(images))
        if total_frames < 1:
            raise ValueError("Webex GIF Prepare: input video contains no frames.")
        if max_duration_seconds and max_duration_seconds > 0:
            requested = max(1, int(round(float(max_duration_seconds) * fps)))
            frame_count = min(total_frames, requested)
        else:
            frame_count = total_frames
        trimmed = images[:frame_count]
        on_frames = max(1, int(round(float(blink_on_seconds) * fps)))
        off_frames = max(1, int(round(float(blink_off_seconds) * fps)))
        cycle = on_frames + off_frames
        on_indexes = [i for i in range(frame_count) if (i % cycle) < on_frames]
        indexes_string = ", ".join(str(i) for i in on_indexes)
        actual_duration = frame_count / fps
        return (trimmed, indexes_string, float(fps), frame_count, float(actual_duration))


class WebexGIFPresetPrepare:
    """v3 preset helper.

    - Limits duration
    - Downsamples the loaded frame rate to a GIF-friendly target FPS
    - Keeps input aspect automatically or center-crops to a requested ratio
    - Resizes to a target *long side*
    - Builds dynamic indexes for blinking text

    Presets intentionally do not promise a final GIF filesize: GIF size depends strongly
    on motion, noise and colour complexity in the source.
    """

    PRESETS = {
        "Webex Small": {"long_side": 288, "fps": 6.0, "duration": 4.0},
        "Webex Balanced": {"long_side": 320, "fps": 8.0, "duration": 5.0},
        "Webex Quality": {"long_side": 384, "fps": 10.0, "duration": 5.5},
    }

    RATIOS = {
        "1:1": 1.0,
        "16:9": 16.0 / 9.0,
        "9:16": 9.0 / 16.0,
        "4:3": 4.0 / 3.0,
        "3:4": 3.0 / 4.0,
    }

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "video_info": ("VHS_VIDEOINFO",),
                "preset": (["Webex Small", "Webex Balanced", "Webex Quality", "Custom"], {"default": "Webex Small"}),
                "aspect_ratio": (["Auto (Input Image)", "1:1", "16:9", "9:16", "4:3", "3:4"], {"default": "Auto (Input Image)"}),
                "custom_long_side": ("INT", {"default": 320, "min": 128, "max": 512, "step": 8}),
                "custom_fps": ("FLOAT", {"default": 8.0, "min": 2.0, "max": 12.0, "step": 1.0}),
                "custom_duration_seconds": ("FLOAT", {"default": 5.0, "min": 0.5, "max": 12.0, "step": 0.5}),
                "blink_on_seconds": ("FLOAT", {"default": 0.5, "min": 0.05, "max": 10.0, "step": 0.05}),
                "blink_off_seconds": ("FLOAT", {"default": 0.5, "min": 0.05, "max": 10.0, "step": 0.05}),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING", "FLOAT", "INT", "FLOAT", "INT", "INT", "STRING")
    RETURN_NAMES = ("images", "text_on_indexes", "fps", "frame_count", "duration_seconds", "width", "height", "settings")
    FUNCTION = "prepare"
    CATEGORY = "Webex GIF Tools"
    DESCRIPTION = "Preset-driven GIF preparation: duration, FPS, aspect ratio, resize and blink schedule."

    @staticmethod
    def _read_fps(video_info):
        if isinstance(video_info, dict):
            for key in ("loaded_fps", "source_fps"):
                value = video_info.get(key)
                try:
                    value = float(value)
                    if value > 0:
                        return value
                except (TypeError, ValueError):
                    pass
        return 12.0

    @staticmethod
    def _crop_to_ratio(images, ratio):
        _, h, w, _ = images.shape
        src_ratio = w / h
        if abs(src_ratio - ratio) < 1e-4:
            return images
        if src_ratio > ratio:
            new_w = max(1, int(round(h * ratio)))
            x0 = max(0, (w - new_w) // 2)
            return images[:, :, x0:x0 + new_w, :]
        new_h = max(1, int(round(w / ratio)))
        y0 = max(0, (h - new_h) // 2)
        return images[:, y0:y0 + new_h, :, :]

    @staticmethod
    def _target_size(w, h, long_side):
        if w >= h:
            tw = int(long_side)
            th = max(2, int(round(h * long_side / w)))
        else:
            th = int(long_side)
            tw = max(2, int(round(w * long_side / h)))
        tw = max(2, int(round(tw / 2)) * 2)
        th = max(2, int(round(th / 2)) * 2)
        return tw, th

    @staticmethod
    def _resize(images, tw, th):
        _, h, w, _ = images.shape
        if w == tw and h == th:
            return images
        x = images.movedim(-1, 1)
        x = F.interpolate(x, size=(th, tw), mode="bicubic", align_corners=False, antialias=True)
        return x.movedim(1, -1).clamp(0.0, 1.0)

    @staticmethod
    def _resample_frames(images, source_fps, target_fps, duration):
        total = int(len(images))
        available_duration = total / source_fps
        used_duration = min(float(duration), available_duration)
        target_fps = min(float(target_fps), float(source_fps))
        count = max(1, int(math.floor(used_duration * target_fps + 1e-6)))
        idx = torch.floor(torch.arange(count, device=images.device, dtype=torch.float32) * (source_fps / target_fps)).long()
        idx = idx.clamp(0, total - 1)
        sampled = images.index_select(0, idx)
        return sampled, target_fps, count / target_fps

    def prepare(
        self,
        images,
        video_info,
        preset="Webex Small",
        aspect_ratio="Auto (Input Image)",
        custom_long_side=320,
        custom_fps=8.0,
        custom_duration_seconds=5.0,
        blink_on_seconds=0.5,
        blink_off_seconds=0.5,
    ):
        if len(images) < 1:
            raise ValueError("Webex GIF Preset: input video contains no frames.")

        source_fps = self._read_fps(video_info)
        if preset == "Custom":
            long_side = int(custom_long_side)
            target_fps = float(custom_fps)
            duration = float(custom_duration_seconds)
        else:
            p = self.PRESETS[preset]
            long_side = int(p["long_side"])
            target_fps = float(p["fps"])
            duration = float(p["duration"])

        sampled, target_fps, actual_duration = self._resample_frames(images, source_fps, target_fps, duration)

        if aspect_ratio != "Auto (Input Image)":
            sampled = self._crop_to_ratio(sampled, self.RATIOS[aspect_ratio])

        _, h, w, _ = sampled.shape
        tw, th = self._target_size(w, h, long_side)
        resized = self._resize(sampled, tw, th)

        frame_count = int(len(resized))
        on_frames = max(1, int(round(float(blink_on_seconds) * target_fps)))
        off_frames = max(1, int(round(float(blink_off_seconds) * target_fps)))
        cycle = on_frames + off_frames
        on_indexes = [i for i in range(frame_count) if (i % cycle) < on_frames]
        indexes_string = ", ".join(str(i) for i in on_indexes)

        settings = (
            f"{preset} | {tw}x{th} | {target_fps:g} FPS | "
            f"{actual_duration:.2f}s | ratio={aspect_ratio}"
        )
        return (resized, indexes_string, float(target_fps), frame_count, float(actual_duration), tw, th, settings)


class WebexGIFGuide:
    """UI-only bilingual guide node. The actual help panel is rendered by the bundled JS extension."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "language": (["Deutsch", "English"], {"default": "Deutsch"}),
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "show"
    CATEGORY = "Webex GIF Tools"
    OUTPUT_NODE = True
    DESCRIPTION = "Bilingual on-canvas guide for the Webex GIF Maker workflow."

    def show(self, language="Deutsch"):
        return ()


NODE_CLASS_MAPPINGS = {
    "WebexGIFGuide": WebexGIFGuide,
    "WebexGIFPrepare": WebexGIFPrepare,
    "WebexGIFPresetPrepare": WebexGIFPresetPrepare,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WebexGIFGuide": "Webex GIF Guide / Hilfe (DE-EN)",
    "WebexGIFPrepare": "Webex GIF Prepare / Blink Schedule",
    "WebexGIFPresetPrepare": "Webex GIF Preset / Prepare",
}
