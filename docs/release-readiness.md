# Release Readiness

Use this checklist before publishing, tagging, or asking reviewers to trust the package surface.

## Package Surface

- Package: `cmdmap`
- Repository: `https://github.com/rogerchappel/cmdmap`
- Pack contents are constrained by the `files` allowlist in `package.json`.

## CLI Surface

- `cmdmap` -> `./dist/src/cli.js`

## Verification Commands

- `npm run check`: `tsc --noEmit`
- `npm run test`: `node --test "dist/**/*.test.js"`
- `npm run build`: `tsc -p tsconfig.json`
- `npm run smoke`: `npm run build && node dist/src/cli.js scan fixtures/polyrepo --out tmp/COMMANDS.md && node dist/src/cli.js scan fixtures/polyrepo --format json > tmp/commands.json && node dist/src/cli.js explain "npm run release"`
- `npm run package:smoke`: `npm pack --dry-run`
- `npm run release:check`: `npm test && npm run check && npm run build && npm run smoke && npm run package:smoke`

Run `npm run release:check` before opening a release PR. Record any skipped command and the reason in the PR body.

## Reviewer Notes

- Compare README examples with the current CLI bins or module exports.
- Inspect `npm pack --dry-run` output for generated logs, caches, or private fixtures.
- Confirm CI exercises the same release check path used locally.
