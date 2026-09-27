# Changelog

## 0.2.0-dev.1
- Replaced the example workflow's KJNodes text path with native GIF Toolkit nodes.
- Added `GIF Prepare / Preset` with video-only preparation responsibilities.
- Added reusable `GIF Text Style` with anchor-based positioning instead of raw X/Y coordinates.
- Added `GIF Text Preview` for single-frame positioning checks.
- Added `GIF Text Overlay` with optional integrated blink timing.
- Added outline, background-box and shadow text styling.
- The v0.2 example workflow now requires only ComfyUI, VideoHelperSuite and ComfyUI-GIFToolkit.
- Kept legacy helper/node IDs for compatibility with older development workflows.

## 0.1.0
- Initial GitHub pre-release.
- Added `GIF Preset / Prepare` with Small, Balanced, Quality and Custom presets.
- Added automatic aspect-ratio handling, duration limiting, FPS reduction and resizing.
- Added dynamic blink scheduling for optional text overlays.
- Added bilingual DE/EN on-canvas guide node.
- Added a ready-to-load example workflow.
- Added bilingual installation, parameter reference and troubleshooting documentation.
- Kept the earlier `GIF Prepare / Blink Schedule` helper for workflow compatibility.
