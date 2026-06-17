# Video Brief: Polyrepo Command Map

## Promise

Show how `cmdmap` gives a maintainer or agent a reviewable command map before running unknown project commands.

## Demo Path

1. Open `fixtures/polyrepo/package.json`, `Makefile`, `Taskfile.yml`, and `scripts/bootstrap.sh`.
2. Run `bash demo/run-polyrepo-scan.sh`.
3. Open `.tmp/demo-polyrepo-scan/COMMANDS.md`.
4. Point to the recommended verification path.
5. Open `.tmp/demo-polyrepo-scan/commands.json` for the automation handoff.

## On-Screen Commands

```sh
npm install
bash demo/run-polyrepo-scan.sh
node dist/src/cli.js scan fixtures/polyrepo --format json
```

## Talk Track

- "The scanner finds command surfaces; it does not execute the discovered commands."
- "The report keeps source file and line evidence next to each finding."
- "The JSON output lets an agent choose a smoke path without scraping Markdown."

## Guardrails

- Do not claim `cmdmap` proves a command is safe.
- Do not imply risky commands are always wrong; they may be release or maintenance commands.
- Keep the demo focused on static discovery and reviewable evidence.
