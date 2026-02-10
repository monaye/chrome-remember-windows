---
name: package-extension
description: Bump version in manifest.json and package the Chrome extension as a zip for Chrome Web Store upload
disable-model-invocation: true
---

# Package Chrome Extension

Bump the extension version and create a distributable zip file.

## Steps

1. **Read current version** from `manifest.json`
2. **Ask the user** which version bump they want:
   - Patch (e.g., 1.0 → 1.1)
   - Minor (e.g., 1.0 → 1.1 if using semver)
   - Custom (user provides the version string)
3. **Update `manifest.json`** with the new version
4. **Create a zip** of the extension, excluding:
   - `.git/`
   - `.claude/`
   - `.DS_Store`
   - `Dev/`
   - Any `*.md` files in the root (README, etc.)
5. **Name the zip** `remember-windows-v{version}.zip` and place it in the `Dev/` directory
6. **Commit** the version bump with message: `Bump version to {version}`
7. **Tag** the commit: `git tag v{version}`
8. **Report** the output zip path and file size to the user
