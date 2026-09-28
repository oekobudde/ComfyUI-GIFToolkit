# Publishing checklist

## Current release candidate

- Registry node id: `gif-toolkit`
- Release version: `0.4.0`
- GitHub repository: `https://github.com/oekobudde/ComfyUI-GIFToolkit`
- Publishing workflow: `.github/workflows/publish-comfy-registry.yml`
- Missing-node discovery helper: `node_list.json`

## Before the first public release

1. Choose and add the repository license.
2. Make the GitHub repository public.
3. Create a publisher at https://registry.comfy.org/.
4. Put the exact publisher id into `[tool.comfy].PublisherId` in `pyproject.toml`.
5. Create a Comfy Registry API key for that publisher.
6. Store the key in GitHub at:
   `Settings -> Secrets and variables -> Actions -> REGISTRY_ACCESS_TOKEN`
7. Merge the release candidate to `main`.
8. Run **Publish to Comfy Registry** manually from GitHub Actions.
9. Verify the Registry page and installation from ComfyUI Manager.
10. Test **Install Missing Custom Nodes** with a clean ComfyUI installation and the included workflow.

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
