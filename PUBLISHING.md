# Publishing checklist

This repository can stay private while the workflow and nodes are tested.

## 1. GitHub
1. Repository: `https://github.com/oekobudde/ComfyUI-WebexGIFTools`
2. Keep it **private** during testing.
3. Use `main` as the default branch.
4. Before making it public, choose and add a license. MIT is a common permissive option, but the license choice should be explicit.
5. Test the included workflow on a clean ComfyUI installation.

## 2. Comfy Registry / Manager
Official Comfy Registry metadata requires a unique node id, repository URL and a Registry PublisherId.

Before first Registry publish:
1. Create a publisher at `https://registry.comfy.org`.
2. Add the real `[tool.comfy]` block to `pyproject.toml`.
3. Add the Registry API key to the GitHub repository secret `REGISTRY_ACCESS_TOKEN`.
4. Run the included **Publish to Comfy Registry** GitHub Action manually.
5. Verify that ComfyUI-Manager can find and install the package and that workflow **Missing Nodes** resolution identifies it correctly.
6. Bump `project.version` for every later Registry release.

The GitHub Action is intentionally manual-only until public publishing is desired.
