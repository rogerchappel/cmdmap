# Release Readiness

Use this checklist before publishing, tagging, or asking reviewers to trust the package surface.

## Package Surface

- Package: `@rogerchappel/cmdmap` (public scoped package)
- Repository: `https://github.com/rogerchappel/cmdmap`
- Pack contents are constrained by the `files` allowlist in `package.json`.

## CLI Surface

- `cmdmap` -> `./dist/src/cli.js`
- Global install: `npm install --global @rogerchappel/cmdmap`
- One-off invocation: `npx --yes @rogerchappel/cmdmap --help`

## Verification Commands

- `npm run check`: `tsc --noEmit`
- `npm run test`: `node --test "dist/**/*.test.js"`
- `npm run build`: `tsc -p tsconfig.json`
- `npm run smoke`: `npm run build && node dist/src/cli.js scan fixtures/polyrepo --out tmp/COMMANDS.md && node dist/src/cli.js scan fixtures/polyrepo --format json > tmp/commands.json && node dist/src/cli.js explain "npm run release"`
- `npm run package:smoke`: packs the tarball, asserts its manifest and README
  agree on `@rogerchappel/cmdmap` / `cmdmap`, installs it in a clean temporary
  prefix, and executes `cmdmap --help` and `cmdmap --version`.
- `npm run release:check`: `npm test && npm run check && npm run build && npm run smoke && npm run package:smoke`

Run `npm run release:check` before opening a release PR. Record any skipped command and the reason in the PR body.

## Reviewer Notes

- Compare README examples with the current CLI bins or module exports.
- Inspect `npm pack --dry-run` output for generated logs, caches, or private fixtures.
- Confirm CI exercises the same release check path used locally.

## Trusted Publishing Setup

The `Release` GitHub Actions workflow publishes only after the complete
`release:check` succeeds. It uses npm trusted publishing (GitHub Actions OIDC),
so do not add an `NPM_TOKEN` repository secret.

Before the first tag, configure `@rogerchappel/cmdmap` on npmjs.com with this
trusted publisher:

- Organization or user: `rogerchappel`
- Repository: `cmdmap`
- Workflow filename: `release.yml`
- Environment: leave blank (the workflow does not declare one)

Tags must match `v<package.json version>`. The workflow publishes the public
scoped package with provenance before it creates the corresponding GitHub
release. A failed npm publish therefore cannot produce a misleading GitHub
release.
