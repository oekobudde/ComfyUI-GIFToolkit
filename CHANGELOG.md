# Changelog

## 0.4.0-dev.1
- Added `GIF Multi-Text Designer` with three independently styled and positioned text layers.
- Added layer tabs, per-layer enable/disable, direct click-to-select, mouse dragging, `Duplicate → next`, and `Clear selected`.
- Each layer has independent text, font, size, color, background, outline, shadow, and advanced style settings.
- Retained a single global `Enable text overlay` switch that bypasses all text rendering without rewiring the workflow.
- Extended `GIF Text Overlay` to render all enabled layers while keeping blink timing global.
- Updated the bilingual on-canvas guide and README with the complete multi-text workflow and parameter reference.
- KJNodes remains unnecessary for the current example workflow.

## 0.3.0-dev.1
- Added `GIF Text Designer`, an inline visual canvas for positioning text by dragging it directly on the preview frame.
- Added dynamic designer auto-sizing so Advanced Style expands/collapses without leaving large empty space.
- Added a single `Enable text overlay` master switch; when disabled, frames pass through unchanged and the text controls are visually disabled.
- Empty designer state now shows only the preview prompt until a real frame has been loaded.
- Adopted the user-tested workflow layout while stripping local media paths and preview references from the public JSON.
- Text/style controls are presented graphically while the underlying workflow values remain serializable.
- Added quick 3×3 placement shortcuts plus live font size, text color, background, outline and shadow controls.
- Added `GIF Export Gate` with preview-first behavior.
- A normal Run now creates only a temporary GIF preview; permanent output is blocked.
- Added an `EXPORT GIF NOW` button that arms one export run and returns the workflow to preview mode afterwards.
- Kept the native `GIF Text Overlay` renderer for final frame-batch rendering and blink timing.
- The example workflow continues to require only ComfyUI, VideoHelperSuite and ComfyUI-GIFToolkit.

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
