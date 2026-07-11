# Agent Onboarding Command Map

Use this recipe when a human or coding agent needs a first command map for an unfamiliar repository before running build, test, release, or cleanup commands.

## Run The Fixture Demo

```bash
bash demo/run-polyrepo-scan.sh
```

The script builds `cmdmap`, scans `fixtures/polyrepo`, and writes:

- `.tmp/demo-polyrepo-scan/COMMANDS.md`
- `.tmp/demo-polyrepo-scan/commands.json`

## Review Order

1. Open the summary counts in `COMMANDS.md`.
2. Read the recommended path before running any command.
3. Inspect caution findings such as long-running dev servers.
4. Inspect risky findings such as publish, secret, or destructive commands.
5. Use JSON output when another tool needs the same evidence.

## Demo Talking Points

- `cmdmap scan` performs static discovery; it does not execute discovered commands.
- Every finding includes file and line evidence from the fixture repo.
- The same scan can produce Markdown for humans and JSON for automation.
- `--fail-on risky` can make CI or agent handoffs stop when risky commands are present.

## Verification

The demo script checks that Markdown output includes `Safe:`, `Caution:`, and `Risky:` sections, and that JSON output includes a `findings` collection.
