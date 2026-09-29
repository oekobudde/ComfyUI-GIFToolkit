# Publishing checklist

## Current release candidate

- Registry node id: `gif-toolkit`
- Release version: `0.4.1`
- GitHub repository: `https://github.com/oekobudde/ComfyUI-GIFToolkit`
- Publishing workflow: `.github/workflows/publish-comfy-registry.yml`
- Missing-node discovery helper: `node_list.json`

## One-time setup

- Repository is public and licensed.
- Comfy Registry publisher id is configured in `[tool.comfy].PublisherId`.
- `REGISTRY_ACCESS_TOKEN` is stored in GitHub Actions secrets.

## Release checklist

1. Bump `project.version` in `pyproject.toml`.
2. Update `CHANGELOG.md`, documentation, workflow metadata and `node_list.json` as needed.
3. Merge the release candidate to `main`.
4. Run **Publish to Comfy Registry** manually from GitHub Actions.
5. Verify the new version on the Registry page and in ComfyUI Manager.
6. Test **Install Missing Custom Nodes** with a clean ComfyUI installation and the included workflow.

## Missing-node discovery

The public workflow currently uses these GIF Toolkit node class ids:

- `GIFToolkitGuide`
- `GIFToolkitPrepareV2`
- `GIFToolkitMultiTextDesigner`
- `GIFToolkitTextOverlay`
- `GIFToolkitExportGate`

They are listed explicitly in `node_list.json` so ComfyUI-Manager can map workflow node ids back to this package during missing-node detection.

The workflow also uses ComfyUI-VideoHelperSuite. It remains a separate dependency and is resolved independently by ComfyUI Manager.

## Later releases

Registry versions are immutable. Bump `project.version` in `pyproject.toml` for every new Registry publication, then run the publish workflow again.
