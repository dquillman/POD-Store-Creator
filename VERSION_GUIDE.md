# Version Management Guide

## How Versioning Works

This project uses **semantic versioning** (major.minor.patch):
- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features
- **Patch** (x.x.1): Bug fixes

Current version is displayed in the app header as a black badge.

---

## Bumping the Version

### Automatic Method (Recommended)

Before each commit, run:

```bash
npm run bump-version
```

This will:
1. Increment the patch version (1.0.0 → 1.0.1)
2. Update `package.json`
3. Update `backend/package.json`
4. Update `frontend/index.html` (title, version badge, LOCAL_VERSION)
5. Print next steps

Then commit and push:

```bash
git add .
git commit -m "Your commit message"
git push
```

---

## Manual Method

If you need to manually set a specific version:

1. Edit `package.json` - change `"version": "1.0.0"`
2. Edit `backend/package.json` - change `"version": "1.0.0"`
3. Edit `frontend/index.html`:
   - Update `<title>POD Creator - v1.0.0</title>`
   - Update `const LOCAL_VERSION = '1.0.0';`
   - Update `<span id="versionBadge">v1.0.0</span>`

---

## Version Display Locations

The version appears in:
1. **App header** - Black badge next to "POD Creator" title
2. **Browser tab title** - "POD Creator - v1.0.0"
3. **Update checker** - Compares with remote version
4. **Package files** - package.json, backend/package.json

---

## When to Bump Versions

### Patch (x.x.+1)
- Bug fixes
- Performance improvements
- Documentation updates
- Minor UI tweaks

**Example:** Button styling fix (1.0.0 → 1.0.1)

### Minor (x.+1.0)
- New features
- New API endpoints
- New tools or scripts
- Non-breaking enhancements

**Example:** Added store status checker (1.0.0 → 1.1.0)

### Major (+1.0.0)
- Breaking API changes
- Complete redesign
- Removed functionality
- Major architecture changes

**Example:** Complete frontend rewrite (1.0.0 → 2.0.0)

---

## Update Checking

The app includes an "Check for Updates" button that:
1. Fetches `frontend/updates.json` from GitHub
2. Compares with `LOCAL_VERSION`
3. Notifies if newer version available

To publish an update notification:

1. Edit `frontend/updates.json`:
```json
{
  "latestVersion": "1.0.1",
  "updateUrl": "https://github.com/dquillman/POD-Store-Creator",
  "changelog": "- Fixed backend deployment\n- Added version display"
}
```

2. Commit and push to GitHub
3. Users will see update notification

---

## Workflow Example

```bash
# 1. Make changes to your code
# ... edit files ...

# 2. Bump version
npm run bump-version

# Output:
# Bumping version: 1.0.0 → 1.0.1
# ✓ Updated package.json
# ✓ Updated frontend/index.html
# ✓ Updated backend/package.json
# 🎉 Version bumped to 1.0.1

# 3. Commit
git add .
git commit -m "Fix backend deployment configuration"

# 4. Push
git push origin main

# 5. GitHub Actions deploys automatically
```

---

## Tips

- **Always bump before committing** - Keeps version history clean
- **Use meaningful commit messages** - They'll show in git history
- **Test before pushing** - Deployments happen automatically
- **Update changelog** - Help users know what changed

---

## Troubleshooting

### "Version not updating in app"

**Problem:** Cached HTML file
**Solution:** Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### "Version script not found"

**Problem:** Missing script permissions
**Solution:** Run `chmod +x bump_version.mjs` or use `node bump_version.mjs`

### "Version out of sync"

**Problem:** Files manually edited
**Solution:** Run `npm run bump-version` to re-sync all files

---

## See Also

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Features Complete](FEATURES_COMPLETE.md)
- [package.json](package.json)
