# cmdmap

`cmdmap` turns a repo's scattered command surfaces into an agent-safe command map: what exists, why it was found, how risky it looks, and what to run first. It is a small local-first CLI for those "new repo, no idea what is safe" moments.

## Quick start

The npm package is not published yet. Until a release is available from the
registry, build a package tarball from a clean checkout and install it into a
local prefix:

```bash
npm ci
npm run build
npm pack
npm install --prefix .cmdmap-local ./rogerchappel-cmdmap-0.1.0.tgz
./.cmdmap-local/node_modules/.bin/cmdmap --help
./.cmdmap-local/node_modules/.bin/cmdmap scan . --out docs/COMMANDS.md
```

The tarball name includes the version from `package.json`; replace `0.1.0` in
the example after that version changes. Remove `.cmdmap-local` and the tarball
when you no longer need the local installation.

You can also run the built CLI directly while developing:

```bash
node dist/src/cli.js scan fixtures/polyrepo --format json
node dist/src/cli.js explain "npm run release:check"
```

### After the npm release

Registry-backed installation will be supported once
`npm view @rogerchappel/cmdmap version` succeeds. At that point, install the
reported version globally or run that same version with `npx`. The package is
scoped because the unscoped `cmdmap` name belongs to unrelated software.

After a global installation, use the `cmdmap` executable directly:

```bash
cmdmap --help
cmdmap --version
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
Finding identity includes the runner, name, command, and complete file/line evidence. This keeps same-named workspace scripts as separate findings, while byte-for-byte identical findings from the same evidence location collapse to one. IDs and report ordering are deterministic for unchanged inputs.

## Safety model

`cmdmap` is conservative by design:

- `test`, `build`, and `lint` commands are usually **safe** verification candidates.
- dev servers and unknown commands are **caution** because they may hang or have unclear side effects.
- release, publish, destructive, secret-related, and network-looking commands are **risky** by default.
- `cmdmap scan` never runs discovered commands.
- `--format` accepts `markdown` (the default) or `json`.
- `--fail-on risky` and `--fail-on risky-release` exit with code `2` when risky commands are present; `--fail-on caution` exits with code `2` for caution or risky findings.
- Unknown commands or options, missing option values, and unsupported `--format` or `--fail-on` values print usage to stderr and exit with code `1`.

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

For a CI-style JSON artifact plus an expected risky-command gate failure:

```bash
bash demo/run-ci-risk-gate.sh
```

Use [docs/tutorials/triage-command-surface.md](docs/tutorials/triage-command-surface.md) for the walkthrough and [docs/promo/video-brief-polyrepo-command-map.md](docs/promo/video-brief-polyrepo-command-map.md) for a short recording outline.
The CI gate recipe is in [docs/tutorials/ci-risk-gate-artifact.md](docs/tutorials/ci-risk-gate-artifact.md), with a focused recording brief in [docs/promo/ci-risk-gate-video-brief.md](docs/promo/ci-risk-gate-video-brief.md).

To turn the scanner's `recommendedPath` into a Markdown handoff brief, run:

```bash
bash demo/run-recommended-path.sh
```

See [docs/tutorials/recommended-path-brief.md](docs/tutorials/recommended-path-brief.md)
and [docs/promo/recommended-path-social-pack.md](docs/promo/recommended-path-social-pack.md).

JSON output is stable enough for agents and CI artifacts:

```bash
cmdmap scan . --format json > command-map.json
```

Explain one command without scanning a repo:

```bash
cmdmap explain "npm publish"
```

For a copy/paste command risk review, run:

```bash
bash demo/run-copy-paste-risk-review.sh
```

The companion walkthrough is
[docs/tutorials/copy-paste-risk-review.md](docs/tutorials/copy-paste-risk-review.md).

For a copied-command review workflow, see
[docs/tutorials/review-a-copied-command.md](docs/tutorials/review-a-copied-command.md).

## Fixture demo

Run the polyrepo walkthrough to generate both Markdown and JSON artifacts from the checked-in mixed command fixture:

```bash
bash demo/run-polyrepo-scan.sh
```

The companion tutorial is [docs/tutorials/triage-command-surface.md](docs/tutorials/triage-command-surface.md), and promotion hooks are in [docs/promo/social-hooks.md](docs/promo/social-hooks.md).

For an agent-onboarding angle, use [docs/tutorials/agent-onboarding-command-map.md](docs/tutorials/agent-onboarding-command-map.md) and the grounded post pack in [docs/promo/agent-onboarding-post-pack.md](docs/promo/agent-onboarding-post-pack.md).

To turn the scan into a compact agent handoff with a recommended first-run list,
use:

```bash
bash demo/run-agent-handoff.sh
```

The companion recipe is [docs/tutorials/agent-command-handoff.md](docs/tutorials/agent-command-handoff.md).

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

For a runnable local version of the risk-gate flow, use
[`demo/run-ci-risk-gate.sh`](demo/run-ci-risk-gate.sh). The companion tutorial is
[`docs/tutorials/ci-risk-gate.md`](docs/tutorials/ci-risk-gate.md).

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
- `npm run package:smoke` verifies required package files and the installed `cmdmap` CLI.

See `docs/release-readiness.md` for the package surface, CLI bins, and reviewer checklist.
