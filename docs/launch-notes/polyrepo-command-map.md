# Launch Note Draft: Polyrepo Command Map Demo

`cmdmap` now includes a runnable polyrepo demo for turning scattered command surfaces into Markdown and JSON artifacts.

## What Changed

- `fixtures/polyrepo/` includes npm, Make, Just, Taskfile, Cargo, pyproject, README, and shell-script command surfaces.
- `demo/run-polyrepo-scan.sh` builds the CLI and writes `.tmp/demo-polyrepo-scan/COMMANDS.md` plus `.tmp/demo-polyrepo-scan/commands.json`.
- `docs/tutorials/triage-command-surface.md` walks through the recommended verification path and risky findings.
- `docs/promo/social-hooks.md` and `docs/promo/video-brief-polyrepo-command-map.md` provide grounded promotion material.

## Why It Matters

New maintainers and coding agents can inspect what commands exist before choosing a build, test, or release path. The demo is safe to run because scanning is static.

## Limitations To Mention

- `cmdmap` classifies command risk heuristically.
- The scanner does not validate that a discovered command succeeds.
- Allowlist decisions still require maintainer review.
