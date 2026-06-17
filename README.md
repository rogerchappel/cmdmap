# cmdmap

`cmdmap` turns a repo's scattered command surfaces into an agent-safe command map: what exists, why it was found, how risky it looks, and what to run first. It is a small local-first CLI for those "new repo, no idea what is safe" moments.

## Quick start

```bash
npm install
npm run build
node dist/src/cli.js scan . --out docs/COMMANDS.md
node dist/src/cli.js scan fixtures/polyrepo --format json
node dist/src/cli.js explain "npm run release:check"
```

Once installed globally or through `npx`, use `cmdmap` directly:

```bash
cmdmap scan . --out docs/COMMANDS.md
cmdmap scan . --format json --fail-on risky
cmdmap rules
```

## What it discovers

V1 scans these local files without executing project commands:

- `package.json` scripts
- `Makefile` targets
- `Justfile` recipes
- `Taskfile.yml` / `Taskfile.yaml` tasks
- `pyproject.toml` scripts/tasks
- `Cargo.toml` default cargo workflows
- README command snippets
- files under `scripts/`

Every finding includes file and line evidence so humans and agents can inspect the source.

## Safety model

`cmdmap` is conservative by design:

- `test`, `build`, and `lint` commands are usually **safe** verification candidates.
- dev servers and unknown commands are **caution** because they may hang or have unclear side effects.
- release, publish, destructive, secret-related, and network-looking commands are **risky** by default.
- `cmdmap scan` never runs discovered commands.
- `--fail-on risky` exits with code `2` when risky commands are present, which is useful in CI.

This is heuristic static analysis, not a sandbox. Treat the output as a map, not permission.

## Configuration

Add `.cmdmaprc.json` at the repo root:

```json
{
  "allowRisky": ["local-release-dry-run"],
  "ignore": ["dev"],
  "labels": {
    "verify": ["test", "lint"]
  },
  "preferredSmokePath": ["lint", "test", "build"]
}
```

- `allowRisky`: known commands to downgrade after review.
- `ignore`: command names or command strings to omit.
- `labels`: custom command labels.
- `preferredSmokePath`: names or commands to prefer in the recommended path.

## Output examples

Markdown output is intended for docs and handoffs:

```bash
cmdmap scan . --out docs/COMMANDS.md
```

The checked-in polyrepo demo generates both Markdown and JSON artifacts:

```bash
bash demo/run-polyrepo-scan.sh
```

Use [docs/tutorials/triage-command-surface.md](docs/tutorials/triage-command-surface.md) for the walkthrough and [docs/promo/video-brief-polyrepo-command-map.md](docs/promo/video-brief-polyrepo-command-map.md) for a short recording outline.

JSON output is stable enough for agents and CI artifacts:

```bash
cmdmap scan . --format json > command-map.json
```

Explain one command without scanning a repo:

```bash
cmdmap explain "npm publish"
```

## Fixture demo

Run the polyrepo walkthrough to generate both Markdown and JSON artifacts from the checked-in mixed command fixture:

```bash
bash demo/run-polyrepo-scan.sh
```

The companion tutorial is [docs/tutorials/triage-command-surface.md](docs/tutorials/triage-command-surface.md), and promotion hooks are in [docs/promo/social-hooks.md](docs/promo/social-hooks.md).

## CI usage

```yaml
- run: npm ci
- run: npm run build
- run: node dist/src/cli.js scan . --format json --fail-on risky > command-map.json
- uses: actions/upload-artifact@v4
  with:
    name: command-map
    path: command-map.json
```

## Limitations

- Does not execute or verify discovered commands.
- YAML/TOML parsing is intentionally lightweight in V1.
- Shell analysis is pattern-based and can miss indirect behavior.
- Cargo commands are inferred defaults from `Cargo.toml`.
- Risk allowlists should be reviewed by maintainers before automation relies on them.

## Development

```bash
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

`fixtures/polyrepo` contains a deliberately mixed repo surface for parser and smoke coverage.

## Release Verification

Before publishing or tagging a release, run the same verification path used by CI:

- `npm run release:check`
- `npm run package:smoke`

See `docs/release-readiness.md` for the package surface, CLI bins, and reviewer checklist.
