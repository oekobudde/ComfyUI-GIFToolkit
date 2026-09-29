# Changelog

## 0.4.1
- Made English the default and only built-in language of the on-canvas guide.
- Removed the `GIFToolkitGuide` language combo so non-English UI translations can follow ComfyUI's locale mechanism.
- Updated the bundled workflow to the new guide schema and added current `gif-toolkit` package metadata for missing-node discovery.
- Updated English and German documentation to match the new language behavior.
- No changes to GIF rendering, text rendering, presets, or export behavior.


## 0.4.0-dev.1
- Added `GIF Multi-Text Designer` with three independently styled and positioned text layers.
- Added layer tabs, per-layer enable/disable, direct click-to-select, mouse dragging, `Duplicate → next`, and `Clear selected`.
- Each layer has independent text, font, size, color, background, outline, shadow, and advanced style settings.
- Added a global `Enable text overlay` master switch that bypasses all text rendering without rewiring the workflow.
- Added global blink timing for all enabled text layers.
- Added visual preview before export and an approval-gated final GIF export flow.
- Added dynamic designer auto-sizing and correct preview aspect-ratio handling.
- Added bilingual on-canvas help.
- Split repository documentation into English `README.md` and German `README_DE.md`.
- Added a ready-to-use example workflow for short looping GIFs.
