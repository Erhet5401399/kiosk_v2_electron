# Erkhet Kiosk Desktop App

## Auto Update (GitHub Releases)

This project is configured for `electron-updater` using Windows `nsis` builds.

### One-time setup

1. Ensure your GitHub repo is correct in `package.json`:
   - `repository.url`
2. Create a GitHub token and set `GH_TOKEN` in your shell.

### Build local release command

```bash
npm run dist:win
```

### Local release command

```bash
npm run release:github
```

Requires:
- `GH_TOKEN` with `contents:write` scope
