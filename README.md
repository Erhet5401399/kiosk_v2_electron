# Erkhet Kiosk Desktop App

## Auto Update (GitHub Releases)

This project is configured for `electron-updater` using Windows `nsis` builds.

### One-time setup

1. Ensure your GitHub repo is correct in `package.json`:
   - `repository.url`
2. Push a git tag using semver format:
   - `v0.0.2`, `v1.0.0`, etc.

### Release pipeline

- Workflow file: `.github/workflows/release.yml`
- Trigger: push a tag matching `v*`
- Output: NSIS installer + updater metadata uploaded to GitHub Release

### Local release command

```bash
npm run release:github
```

Requires:
- `GH_TOKEN` with `contents:write` scope
