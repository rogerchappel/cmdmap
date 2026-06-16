# Triage A New Repo Command Surface

This tutorial uses the checked-in `fixtures/polyrepo` workspace to show how `cmdmap` turns scattered command surfaces into a reviewable handoff.

## 1. Generate A Command Map

```bash
npm install
bash demo/run-polyrepo-scan.sh
```

The demo writes:

- `.tmp/demo-polyrepo-scan/COMMANDS.md`
- `.tmp/demo-polyrepo-scan/commands.json`

## 2. Read The Recommended Path

Open the Markdown report and start with `Recommended verification path`. In the fixture, `cmdmap` prefers low-side-effect checks such as lint, test, and build commands before unknown or release-looking commands.

## 3. Inspect Risky Findings

The fixture intentionally includes risky examples such as publish, clean, and secret-reading commands. `cmdmap` reports the file and line evidence for each one so a maintainer can decide whether to ignore, document, or allowlist it.

## 4. Use JSON For Automation

The JSON report contains the same findings and summary counts. Agents can read it without scraping Markdown, then choose a safe verification path or stop when `--fail-on risky` would be more appropriate.

## Safety Notes

- `cmdmap scan` does not run discovered project commands.
- `--fail-on risky` is a gate, not proof that safe commands are harmless.
- Review `allowRisky` entries in `.cmdmaprc.json` before relying on them in automation.
