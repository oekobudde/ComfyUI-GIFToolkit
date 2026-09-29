import json
import math
import os
import uuid
from pathlib import Path

import folder_paths
from comfy_execution.graph import ExecutionBlocker

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageColor, ImageDraw, ImageFont


def _discover_fonts():
    """Return a stable display-name -> font-path map without requiring another node pack."""
    found = {"PIL Default": None}
    roots = [
        Path(__file__).resolve().parent / "fonts",
        Path("C:/Windows/Fonts"),
        Path("/usr/share/fonts"),
        Path("/usr/local/share/fonts"),
        Path.home() / ".fonts",
        Path.home() / "Library/Fonts",
        Path("/Library/Fonts"),
        Path("/System/Library/Fonts"),
    ]
    for root in roots:
        try:
            if not root.exists():
                continue
            for base, _, files in os.walk(root):
                for name in files:
                    if not name.lower().endswith((".ttf", ".otf", ".ttc")):
                        continue
                    path = str(Path(base) / name)
                    label = name
                    if label not in found:
                        found[label] = path
        except OSError:
            continue
    return found


FONT_PATHS = _discover_fonts()
FONT_CHOICES = list(FONT_PATHS.keys())


def _default_font_choice():
    preferred = ("arialbd.ttf", "dejavusans-bold.ttf", "arial.ttf", "dejavusans.ttf")
    lower = {name.lower(): name for name in FONT_CHOICES}
    for key in preferred:
        if key in lower:
            return lower[key]
    return FONT_CHOICES[0]


DEFAULT_FONT = _default_font_choice()


def _load_font(choice, size):
    path = FONT_PATHS.get(choice)
    if path:
        try:
            return ImageFont.truetype(path, int(size))
        except Exception:
            pass
    try:
        return ImageFont.load_default(size=int(size))
    except TypeError:
        return ImageFont.load_default()


def _rgb(value, fallback):
    try:
        color = ImageColor.getrgb(str(value))
    except Exception:
        color = ImageColor.getrgb(fallback)
    return tuple(color[:3])


def _tensor_frame_to_pil(frame):
    array = frame.detach().clamp(0, 1).mul(255).round().to(torch.uint8).cpu().numpy()
    if array.shape[-1] == 4:
        return Image.fromarray(array, mode="RGBA")
    return Image.fromarray(array[..., :3], mode="RGB")


def _pil_to_tensor(image, device, dtype):
    array = np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0
    return torch.from_numpy(array).to(device=device, dtype=dtype)


def _text_box(draw, text, font, stroke_width, spacing):
    try:
        bbox = draw.multiline_textbbox(
            (0, 0), text, font=font, stroke_width=stroke_width, spacing=spacing, align="center"
        )
    except AttributeError:
        bbox = draw.textbbox((0, 0), text, font=font, stroke_width=stroke_width)
    return bbox


def _overlay_text_on_frame(frame, style):
    text = str(style.get("text", ""))
    if not style.get("enabled", True) or not text.strip():
        return frame

    base = _tensor_frame_to_pil(frame).convert("RGBA")
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font = _load_font(style.get("font", DEFAULT_FONT), style.get("font_size", 34))
    outline_width = int(style.get("outline_width", 0)) if style.get("outline_enabled", True) else 0
    line_spacing = int(style.get("line_spacing", 4))
    bbox = _text_box(draw, text, font, outline_width, line_spacing)
    text_w = max(1, bbox[2] - bbox[0])
    text_h = max(1, bbox[3] - bbox[1])

    background_enabled = bool(style.get("background_enabled", False))
    padding = int(style.get("padding", 8)) if background_enabled else 0
    box_w = text_w + padding * 2
    box_h = text_h + padding * 2

    image_w, image_h = base.size
    margin_x = int(style.get("margin_x", 16))
    margin_y = int(style.get("margin_y", 16))
    position = style.get("position", "Top Center")

    if position == "Custom (%)":
        center_x = image_w * float(style.get("custom_x_percent", 50.0)) / 100.0
        center_y = image_h * float(style.get("custom_y_percent", 15.0)) / 100.0
        box_x = int(round(center_x - box_w / 2))
        box_y = int(round(center_y - box_h / 2))
    else:
        cols = {
            "Left": margin_x,
            "Center": int(round((image_w - box_w) / 2)),
            "Right": image_w - box_w - margin_x,
        }
        rows = {
            "Top": margin_y,
            "Center": int(round((image_h - box_h) / 2)),
            "Bottom": image_h - box_h - margin_y,
        }
        parts = position.split(" ")
        if position == "Center":
            row_name, col_name = "Center", "Center"
        else:
            row_name = parts[0]
            col_name = parts[1] if len(parts) > 1 else "Center"
        box_x = cols.get(col_name, cols["Center"])
        box_y = rows.get(row_name, rows["Top"])

    box_x = max(0, min(image_w - box_w, box_x))
    box_y = max(0, min(image_h - box_h, box_y))

    if background_enabled:
        bg = _rgb(style.get("background_color", "black"), "black")
        alpha = int(max(0, min(255, style.get("background_opacity", 160))))
        radius = max(0, int(style.get("corner_radius", 8)))
        draw.rounded_rectangle(
            [box_x, box_y, box_x + box_w, box_y + box_h],
            radius=radius,
            fill=(*bg, alpha),
        )

    text_x = box_x + padding - bbox[0]
    text_y = box_y + padding - bbox[1]

    if style.get("shadow_enabled", False):
        shadow = _rgb(style.get("shadow_color", "black"), "black")
        draw.multiline_text(
            (text_x + int(style.get("shadow_offset_x", 2)),
             text_y + int(style.get("shadow_offset_y", 2))),
            text,
            font=font,
            fill=(*shadow, 220),
            spacing=line_spacing,
            align="center",
            stroke_width=outline_width,
            stroke_fill=(*shadow, 220),
        )

    fill = _rgb(style.get("font_color", "yellow"), "yellow")
    outline = _rgb(style.get("outline_color", "black"), "black")
    draw.multiline_text(
        (text_x, text_y),
        text,
        font=font,
        fill=(*fill, 255),
        spacing=line_spacing,
        align="center",
        stroke_width=outline_width,
        stroke_fill=(*outline, 255),
    )

    result = Image.alpha_composite(base, overlay)
    return _pil_to_tensor(result, frame.device, frame.dtype)


def _default_text_layer(index=0):
    positions = [(45.2, 5.6), (15.0, 85.0), (85.0, 85.0)]
    x, y = positions[max(0, min(index, len(positions) - 1))]
    return {
        "enabled": index == 0,
        "text": "LET'S GO!" if index == 0 else "",
        "font": DEFAULT_FONT,
        "font_size": 16 if index == 0 else 20,
        "font_color": "#40e704" if index == 0 else "#ffffff",
        "x_percent": x,
        "y_percent": y,
        "background_enabled": False,
        "background_color": "#000000",
        "background_opacity": 160,
        "padding": 8,
        "corner_radius": 8,
        "outline_enabled": True,
        "outline_color": "#000000",
        "outline_width": 2,
        "shadow_enabled": index == 0,
        "shadow_color": "#000000",
        "shadow_offset_x": 2,
        "shadow_offset_y": 2,
        "line_spacing": 4,
    }


def _normalize_text_layer(value, index=0):
    base = _default_text_layer(index)
    if isinstance(value, dict):
        base.update({k: v for k, v in value.items() if k in base})
    base["enabled"] = bool(base.get("enabled", False))
    base["text"] = str(base.get("text", ""))
    base["font"] = str(base.get("font", DEFAULT_FONT))
    if base["font"] not in FONT_PATHS:
        base["font"] = DEFAULT_FONT
    base["font_size"] = max(6, min(256, int(base.get("font_size", 20))))
    base["font_color"] = str(base.get("font_color", "#ffffff"))
    base["x_percent"] = max(0.0, min(100.0, float(base.get("x_percent", 50.0))))
    base["y_percent"] = max(0.0, min(100.0, float(base.get("y_percent", 50.0))))
    base["background_enabled"] = bool(base.get("background_enabled", False))
    base["background_color"] = str(base.get("background_color", "#000000"))
    base["background_opacity"] = max(0, min(255, int(base.get("background_opacity", 160))))
    base["padding"] = max(0, min(128, int(base.get("padding", 8))))
    base["corner_radius"] = max(0, min(128, int(base.get("corner_radius", 8))))
    base["outline_enabled"] = bool(base.get("outline_enabled", True))
    base["outline_color"] = str(base.get("outline_color", "#000000"))
    base["outline_width"] = max(0, min(32, int(base.get("outline_width", 2))))
    base["shadow_enabled"] = bool(base.get("shadow_enabled", False))
    base["shadow_color"] = str(base.get("shadow_color", "#000000"))
    base["shadow_offset_x"] = max(-64, min(64, int(base.get("shadow_offset_x", 2))))
    base["shadow_offset_y"] = max(-64, min(64, int(base.get("shadow_offset_y", 2))))
    base["line_spacing"] = max(0, min(64, int(base.get("line_spacing", 4))))
    return base


def _parse_layers_json(value):
    layers = []
    try:
        parsed = json.loads(value) if isinstance(value, str) else value
        if isinstance(parsed, dict):
            parsed = parsed.get("layers", [])
        if isinstance(parsed, list):
            layers = parsed[:3]
    except Exception:
        layers = []
    normalized = [_normalize_text_layer(layers[i] if i < len(layers) else {}, i) for i in range(3)]
    return normalized


DEFAULT_TEXT_LAYERS = [_default_text_layer(i) for i in range(3)]
DEFAULT_TEXT_LAYERS_JSON = json.dumps(DEFAULT_TEXT_LAYERS, ensure_ascii=False, separators=(",", ":"))
FONT_CATALOG_JSON = json.dumps(FONT_CHOICES, ensure_ascii=False, separators=(",", ":"))


def _layer_to_render_style(layer):
    return {
        "enabled": bool(layer.get("enabled", False)),
        "text": str(layer.get("text", "")),
        "font": layer.get("font", DEFAULT_FONT),
        "font_size": int(layer.get("font_size", 20)),
        "font_color": layer.get("font_color", "#ffffff"),
        "position": "Custom (%)",
        "margin_x": 0,
        "margin_y": 0,
        "custom_x_percent": float(layer.get("x_percent", 50.0)),
        "custom_y_percent": float(layer.get("y_percent", 50.0)),
        "background_enabled": bool(layer.get("background_enabled", False)),
        "background_color": layer.get("background_color", "#000000"),
        "background_opacity": int(layer.get("background_opacity", 160)),
        "padding": int(layer.get("padding", 8)),
        "corner_radius": int(layer.get("corner_radius", 8)),
        "outline_enabled": bool(layer.get("outline_enabled", True)),
        "outline_color": layer.get("outline_color", "#000000"),
        "outline_width": int(layer.get("outline_width", 2)),
        "shadow_enabled": bool(layer.get("shadow_enabled", False)),
        "shadow_color": layer.get("shadow_color", "#000000"),
        "shadow_offset_x": int(layer.get("shadow_offset_x", 2)),
        "shadow_offset_y": int(layer.get("shadow_offset_y", 2)),
        "line_spacing": int(layer.get("line_spacing", 4)),
    }


def _overlay_text_layers_on_frame(frame, style):
    if not style.get("enabled", True):
        return frame
    layers = style.get("layers")
    if not isinstance(layers, list):
        return _overlay_text_on_frame(frame, style)
    result = frame
    for index, layer in enumerate(layers[:3]):
        normalized = _normalize_text_layer(layer, index)
        if not normalized["enabled"] or not normalized["text"].strip():
            continue
        result = _overlay_text_on_frame(result, _layer_to_render_style(normalized))
    return result


class GIFToolkitPrepare:
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
    CATEGORY = "GIF Toolkit"

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
            raise ValueError("GIF Prepare: input video contains no frames.")
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


class GIFToolkitPresetPrepare:
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
        "Small": {"long_side": 288, "fps": 6.0, "duration": 4.0},
        "Balanced": {"long_side": 320, "fps": 8.0, "duration": 5.0},
        "Quality": {"long_side": 384, "fps": 10.0, "duration": 5.5},
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
                "preset": (["Small", "Balanced", "Quality", "Custom"], {"default": "Small"}),
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
    CATEGORY = "GIF Toolkit"
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
        preset="Small",
        aspect_ratio="Auto (Input Image)",
        custom_long_side=320,
        custom_fps=8.0,
        custom_duration_seconds=5.0,
        blink_on_seconds=0.5,
        blink_off_seconds=0.5,
    ):
        if len(images) < 1:
            raise ValueError("GIF Preset: input video contains no frames.")

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


class GIFToolkitPrepareV2(GIFToolkitPresetPrepare):
    """Clean v0.2 video preparation: ratio, size, FPS and duration only."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "video_info": ("VHS_VIDEOINFO",),
                "preset": (["Small", "Balanced", "Quality", "Custom"], {"default": "Balanced"}),
                "aspect_ratio": (["Auto (Input Image)", "1:1", "16:9", "9:16", "4:3", "3:4"], {"default": "Auto (Input Image)"}),
                "custom_long_side": ("INT", {"default": 320, "min": 128, "max": 1024, "step": 8}),
                "custom_fps": ("FLOAT", {"default": 8.0, "min": 2.0, "max": 24.0, "step": 1.0}),
                "custom_duration_seconds": ("FLOAT", {"default": 5.0, "min": 0.5, "max": 30.0, "step": 0.5}),
            }
        }

    RETURN_TYPES = ("IMAGE", "FLOAT", "INT", "FLOAT", "INT", "INT", "STRING")
    RETURN_NAMES = ("images", "fps", "frame_count", "duration_seconds", "width", "height", "settings")
    FUNCTION = "prepare_v2"
    CATEGORY = "GIF Toolkit"
    DESCRIPTION = "Prepare video frames for GIF output: preset, aspect ratio, resize, FPS and duration."

    def prepare_v2(
        self,
        images,
        video_info,
        preset="Balanced",
        aspect_ratio="Auto (Input Image)",
        custom_long_side=320,
        custom_fps=8.0,
        custom_duration_seconds=5.0,
    ):
        if len(images) < 1:
            raise ValueError("GIF Prepare: input video contains no frames.")

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

        sampled, target_fps, actual_duration = self._resample_frames(
            images, source_fps, target_fps, duration
        )
        if aspect_ratio != "Auto (Input Image)":
            sampled = self._crop_to_ratio(sampled, self.RATIOS[aspect_ratio])

        _, h, w, _ = sampled.shape
        tw, th = self._target_size(w, h, long_side)
        resized = self._resize(sampled, tw, th)
        frame_count = int(len(resized))
        settings = (
            f"{preset} | {tw}x{th} | {target_fps:g} FPS | "
            f"{actual_duration:.2f}s | ratio={aspect_ratio}"
        )
        return (
            resized,
            float(target_fps),
            frame_count,
            float(actual_duration),
            tw,
            th,
            settings,
        )


class GIFToolkitMultiTextDesigner:
    """Visual three-layer text designer with an on-node drag canvas."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "enabled": ("BOOLEAN", {"default": True}),
                "layers_json": ("STRING", {"default": DEFAULT_TEXT_LAYERS_JSON, "multiline": True}),
                "active_layer": ("INT", {"default": 0, "min": 0, "max": 2, "step": 1}),
                "font_catalog": (FONT_CHOICES, {"default": DEFAULT_FONT}),
                "preview_frame": ("INT", {"default": 0, "min": 0, "max": 9999, "step": 1}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ("GIF_TEXT_STYLE", "IMAGE")
    RETURN_NAMES = ("style", "preview")
    FUNCTION = "design"
    OUTPUT_NODE = True
    CATEGORY = "GIF Toolkit/Text"
    DESCRIPTION = "Visual multi-text designer with up to three independently positioned and styled text layers."

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("nan")

    def design(
        self,
        images,
        enabled=True,
        layers_json=DEFAULT_TEXT_LAYERS_JSON,
        active_layer=0,
        font_catalog=DEFAULT_FONT,
        preview_frame=0,
        unique_id=None,
    ):
        if len(images) < 1:
            raise ValueError("GIF Multi-Text Designer: no input frames.")

        layers = _parse_layers_json(layers_json)
        active_layer = max(0, min(2, int(active_layer)))
        idx = max(0, min(int(preview_frame), len(images) - 1))
        style = {
            "enabled": bool(enabled),
            "active_layer": active_layer,
            "layers": layers,
        }

        base_frame = images[idx]
        rendered = _overlay_text_layers_on_frame(base_frame, style).unsqueeze(0)

        temp_dir = folder_paths.get_temp_directory()
        os.makedirs(temp_dir, exist_ok=True)
        safe_id = str(unique_id or "multi_designer").replace("/", "_").replace("\\", "_")
        filename = f"gif_toolkit_multi_designer_{safe_id}_{uuid.uuid4().hex}.png"
        path = os.path.join(temp_dir, filename)
        _tensor_frame_to_pil(base_frame).save(path, "PNG")

        return {
            "ui": {
                "gif_toolkit_multi_designer": [{
                    "filename": filename,
                    "subfolder": "",
                    "type": "temp",
                    "frame_index": idx,
                    "width": int(base_frame.shape[1]),
                    "height": int(base_frame.shape[0]),
                }]
            },
            "result": (style, rendered),
        }


class GIFToolkitTextDesigner:
    """Visual text designer with an on-node drag canvas.

    The browser UI is provided by web/js/gif_text_designer.js. Python keeps the
    saved workflow values authoritative and renders exactly the same style during
    final export.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "enabled": ("BOOLEAN", {"default": True}),
                "text": ("STRING", {"default": "LET'S GO!", "multiline": True}),
                "font": (FONT_CHOICES, {"default": DEFAULT_FONT}),
                "font_size": ("INT", {"default": 34, "min": 6, "max": 256, "step": 1}),
                "font_color": ("STRING", {"default": "#ffff00"}),
                "x_percent": ("FLOAT", {"default": 50.0, "min": 0.0, "max": 100.0, "step": 0.1}),
                "y_percent": ("FLOAT", {"default": 15.0, "min": 0.0, "max": 100.0, "step": 0.1}),
                "background_enabled": ("BOOLEAN", {"default": False}),
                "background_color": ("STRING", {"default": "#000000"}),
                "background_opacity": ("INT", {"default": 160, "min": 0, "max": 255, "step": 1}),
                "padding": ("INT", {"default": 8, "min": 0, "max": 128, "step": 1}),
                "corner_radius": ("INT", {"default": 8, "min": 0, "max": 128, "step": 1}),
                "outline_enabled": ("BOOLEAN", {"default": True}),
                "outline_color": ("STRING", {"default": "#000000"}),
                "outline_width": ("INT", {"default": 2, "min": 0, "max": 32, "step": 1}),
                "shadow_enabled": ("BOOLEAN", {"default": False}),
                "shadow_color": ("STRING", {"default": "#000000"}),
                "shadow_offset_x": ("INT", {"default": 2, "min": -64, "max": 64, "step": 1}),
                "shadow_offset_y": ("INT", {"default": 2, "min": -64, "max": 64, "step": 1}),
                "line_spacing": ("INT", {"default": 4, "min": 0, "max": 64, "step": 1}),
                "preview_frame": ("INT", {"default": 0, "min": 0, "max": 9999, "step": 1}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ("GIF_TEXT_STYLE", "IMAGE")
    RETURN_NAMES = ("style", "preview")
    FUNCTION = "design"
    OUTPUT_NODE = True
    CATEGORY = "GIF Toolkit/Text"
    DESCRIPTION = "Visual drag-and-drop text designer with an inline preview canvas."

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        # The temp preview image must be refreshed on each explicit Run.
        return float("nan")

    def design(
        self,
        images,
        enabled=True,
        text="LET'S GO!",
        font=DEFAULT_FONT,
        font_size=34,
        font_color="#ffff00",
        x_percent=50.0,
        y_percent=15.0,
        background_enabled=False,
        background_color="#000000",
        background_opacity=160,
        padding=8,
        corner_radius=8,
        outline_enabled=True,
        outline_color="#000000",
        outline_width=2,
        shadow_enabled=False,
        shadow_color="#000000",
        shadow_offset_x=2,
        shadow_offset_y=2,
        line_spacing=4,
        preview_frame=0,
        unique_id=None,
    ):
        if len(images) < 1:
            raise ValueError("GIF Text Designer: no input frames.")

        idx = max(0, min(int(preview_frame), len(images) - 1))
        style = {
            "enabled": bool(enabled),
            "text": str(text),
            "font": font,
            "font_size": int(font_size),
            "font_color": str(font_color),
            "position": "Custom (%)",
            "margin_x": 0,
            "margin_y": 0,
            "custom_x_percent": float(x_percent),
            "custom_y_percent": float(y_percent),
            "background_enabled": bool(background_enabled),
            "background_color": str(background_color),
            "background_opacity": int(background_opacity),
            "padding": int(padding),
            "corner_radius": int(corner_radius),
            "outline_enabled": bool(outline_enabled),
            "outline_color": str(outline_color),
            "outline_width": int(outline_width),
            "shadow_enabled": bool(shadow_enabled),
            "shadow_color": str(shadow_color),
            "shadow_offset_x": int(shadow_offset_x),
            "shadow_offset_y": int(shadow_offset_y),
            "line_spacing": int(line_spacing),
        }

        base_frame = images[idx]
        rendered = _overlay_text_on_frame(base_frame, style).unsqueeze(0)

        temp_dir = folder_paths.get_temp_directory()
        os.makedirs(temp_dir, exist_ok=True)
        safe_id = str(unique_id or "designer").replace("/", "_").replace("\\", "_")
        filename = f"gif_toolkit_designer_{safe_id}_{uuid.uuid4().hex}.png"
        path = os.path.join(temp_dir, filename)
        _tensor_frame_to_pil(base_frame).save(path, "PNG")

        return {
            "ui": {
                "gif_toolkit_designer": [{
                    "filename": filename,
                    "subfolder": "",
                    "type": "temp",
                    "frame_index": idx,
                    "width": int(base_frame.shape[1]),
                    "height": int(base_frame.shape[0]),
                }]
            },
            "result": (style, rendered),
        }


class GIFToolkitExportGate:
    """Silently blocks the permanent GIF saver while the workflow is in preview mode."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "export_enabled": ("BOOLEAN", {"default": False}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "gate"
    CATEGORY = "GIF Toolkit/Output"
    DESCRIPTION = "Preview-only by default. Enable export to allow the permanent saver to run."

    def gate(self, images, export_enabled=False):
        if not export_enabled:
            return {
                "ui": {"gif_toolkit_export_gate": [{"state": "preview"}]},
                "result": (ExecutionBlocker(None),),
            }
        return {
            "ui": {"gif_toolkit_export_gate": [{"state": "export"}]},
            "result": (images,),
        }


class GIFToolkitTextStyle:
    """Create a reusable text style object shared by Preview and Overlay."""

    POSITIONS = [
        "Top Left", "Top Center", "Top Right",
        "Center Left", "Center", "Center Right",
        "Bottom Left", "Bottom Center", "Bottom Right",
        "Custom (%)",
    ]

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "enabled": ("BOOLEAN", {"default": True}),
                "text": ("STRING", {"default": "LET'S GO!", "multiline": True}),
                "font": (FONT_CHOICES, {"default": DEFAULT_FONT}),
                "font_size": ("INT", {"default": 34, "min": 6, "max": 256, "step": 1}),
                "font_color": ("STRING", {"default": "yellow"}),
                "position": (cls.POSITIONS, {"default": "Top Center"}),
                "margin_x": ("INT", {"default": 16, "min": 0, "max": 1024, "step": 1}),
                "margin_y": ("INT", {"default": 16, "min": 0, "max": 1024, "step": 1}),
                "custom_x_percent": ("FLOAT", {"default": 50.0, "min": 0.0, "max": 100.0, "step": 1.0}),
                "custom_y_percent": ("FLOAT", {"default": 15.0, "min": 0.0, "max": 100.0, "step": 1.0}),
                "background_enabled": ("BOOLEAN", {"default": False}),
                "background_color": ("STRING", {"default": "black"}),
                "background_opacity": ("INT", {"default": 160, "min": 0, "max": 255, "step": 1}),
                "padding": ("INT", {"default": 8, "min": 0, "max": 128, "step": 1}),
                "corner_radius": ("INT", {"default": 8, "min": 0, "max": 128, "step": 1}),
                "outline_enabled": ("BOOLEAN", {"default": True}),
                "outline_color": ("STRING", {"default": "black"}),
                "outline_width": ("INT", {"default": 2, "min": 0, "max": 32, "step": 1}),
                "shadow_enabled": ("BOOLEAN", {"default": False}),
                "shadow_color": ("STRING", {"default": "black"}),
                "shadow_offset_x": ("INT", {"default": 2, "min": -64, "max": 64, "step": 1}),
                "shadow_offset_y": ("INT", {"default": 2, "min": -64, "max": 64, "step": 1}),
                "line_spacing": ("INT", {"default": 4, "min": 0, "max": 64, "step": 1}),
            }
        }

    RETURN_TYPES = ("GIF_TEXT_STYLE",)
    RETURN_NAMES = ("style",)
    FUNCTION = "build"
    CATEGORY = "GIF Toolkit/Text"
    DESCRIPTION = "Reusable text style with human-friendly anchor positions instead of raw X/Y placement."

    def build(self, **kwargs):
        return (dict(kwargs),)


class GIFToolkitTextPreview:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "style": ("GIF_TEXT_STYLE",),
                "preview_frame": ("INT", {"default": 0, "min": 0, "max": 9999, "step": 1}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("preview",)
    FUNCTION = "preview"
    CATEGORY = "GIF Toolkit/Text"
    DESCRIPTION = "Render the text style on a single frame for quick positioning."

    def preview(self, images, style, preview_frame=0):
        if len(images) < 1:
            raise ValueError("GIF Text Preview: no input frames.")
        idx = max(0, min(int(preview_frame), len(images) - 1))
        frame = images[idx]
        rendered = _overlay_text_on_frame(frame, style)
        return (rendered.unsqueeze(0),)


class GIFToolkitTextOverlay:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "fps": ("FLOAT", {"default": 8.0, "min": 0.1, "max": 120.0, "step": 0.1}),
                "style": ("GIF_TEXT_STYLE",),
                "blink_enabled": ("BOOLEAN", {"default": True}),
                "blink_on_seconds": ("FLOAT", {"default": 0.5, "min": 0.05, "max": 10.0, "step": 0.05}),
                "blink_off_seconds": ("FLOAT", {"default": 0.5, "min": 0.05, "max": 10.0, "step": 0.05}),
            }
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("images",)
    FUNCTION = "apply"
    CATEGORY = "GIF Toolkit/Text"
    DESCRIPTION = "Apply text and optional blinking directly to the complete frame batch."

    def apply(
        self,
        images,
        fps,
        style,
        blink_enabled=True,
        blink_on_seconds=0.5,
        blink_off_seconds=0.5,
    ):
        if len(images) < 1 or not style.get("enabled", True):
            return (images,)

        layers = style.get("layers")
        if isinstance(layers, list):
            has_visible_text = any(
                bool(_normalize_text_layer(layer, i).get("enabled", False))
                and bool(str(_normalize_text_layer(layer, i).get("text", "")).strip())
                for i, layer in enumerate(layers[:3])
            )
            if not has_visible_text:
                return (images,)
        elif not str(style.get("text", "")).strip():
            return (images,)

        fps = max(0.1, float(fps))
        if blink_enabled:
            on_frames = max(1, int(round(float(blink_on_seconds) * fps)))
            off_frames = max(1, int(round(float(blink_off_seconds) * fps)))
            cycle = on_frames + off_frames
        else:
            on_frames, cycle = 1, 1

        output = []
        for i, frame in enumerate(images):
            visible = (not blink_enabled) or ((i % cycle) < on_frames)
            output.append(_overlay_text_layers_on_frame(frame, style) if visible else frame)
        return (torch.stack(output, dim=0),)


class GIFToolkitGuide:
    """UI-only guide node. The help panel is rendered by the bundled JS extension."""

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {}}

    RETURN_TYPES = ()
    FUNCTION = "show"
    CATEGORY = "GIF Toolkit"
    OUTPUT_NODE = True
    DESCRIPTION = "On-canvas guide for the GIF Toolkit workflow."

    def show(self):
        return ()


NODE_CLASS_MAPPINGS = {
    "GIFToolkitGuide": GIFToolkitGuide,
    "GIFToolkitPrepare": GIFToolkitPrepare,
    "GIFToolkitPresetPrepare": GIFToolkitPresetPrepare,
    "GIFToolkitPrepareV2": GIFToolkitPrepareV2,
    "GIFToolkitMultiTextDesigner": GIFToolkitMultiTextDesigner,
    "GIFToolkitTextDesigner": GIFToolkitTextDesigner,
    "GIFToolkitExportGate": GIFToolkitExportGate,
    "GIFToolkitTextStyle": GIFToolkitTextStyle,
    "GIFToolkitTextPreview": GIFToolkitTextPreview,
    "GIFToolkitTextOverlay": GIFToolkitTextOverlay,

    # Backward-compatible aliases for workflows created before the project rename.
    "WebexGIFGuide": GIFToolkitGuide,
    "WebexGIFPrepare": GIFToolkitPrepare,
    "WebexGIFPresetPrepare": GIFToolkitPresetPrepare,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "GIFToolkitGuide": "GIF Toolkit Guide / Help",
    "GIFToolkitPrepare": "GIF Prepare / Blink Schedule",
    "GIFToolkitPresetPrepare": "GIF Preset / Prepare (legacy)",
    "GIFToolkitPrepareV2": "GIF Prepare / Preset",
    "GIFToolkitMultiTextDesigner": "GIF Multi-Text Designer",
    "GIFToolkitTextDesigner": "GIF Text Designer (legacy single-layer)",
    "GIFToolkitExportGate": "GIF Export Gate",
    "GIFToolkitTextStyle": "GIF Text Style",
    "GIFToolkitTextPreview": "GIF Text Preview",
    "GIFToolkitTextOverlay": "GIF Text Overlay",
    "WebexGIFGuide": "GIF Toolkit Guide / Help (legacy alias)",
    "WebexGIFPrepare": "GIF Prepare / Blink Schedule (legacy alias)",
    "WebexGIFPresetPrepare": "GIF Preset / Prepare (legacy alias)",
}
