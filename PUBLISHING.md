# Publishing Assay CLI to npm

## Prerequisites

1. **npm account**: Create an account at https://www.npmjs.com/signup
2. **Login to npm**: `npm login`
3. **Verify you're logged in**: `npm whoami`

## Publishing Steps

### 1. Build the CLI

```bash
cd assay-cli
npm run build
```

### 2. Test the build locally

```bash
# Test that it works
node dist/index.js --help

# Or link it locally
npm link
assay --help
```

### 3. Check what will be published

```bash
npm pack --dry-run
```

This shows what files will be included in the package.

### 4. Publish to npm

**For first-time publishing:**
```bash
npm publish
```

Note: This package uses an unscoped name (`assay-cli`), so `--access public` is not required.

**For updates:**
```bash
# Update version first
npm version patch  # or minor, or major
# Then publish
npm publish
```

## Version Management

- **Patch** (1.0.0 → 1.0.1): Bug fixes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

## Installation for Users

After publishing, users can install with:

```bash
npm install -g assay-cli
```

Or use with `npx` without installing:

```bash
npx assay-cli auth login
```

## Troubleshooting

**Error: "You must verify your email"**
- Check your npm account email and verify it

**Error: "Package name already exists"**
- The package name `assay-cli` might be taken
- You may need to use a different name
- Check: https://www.npmjs.com/package/assay-cli

**Error: "You do not have permission"**
- Make sure you're logged in: `npm whoami`
- Make sure you own the package

## Unpublishing (if needed)

⚠️ **Warning**: Only unpublish within 72 hours of publishing

```bash
npm unpublish assay-cli@1.0.0
```

Or to unpublish all versions (be very careful!):

```bash
npm unpublish assay-cli --force
```

