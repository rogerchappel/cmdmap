# Social Hooks

Grounded post drafts for the polyrepo demo.

## Hooks

1. New repo, unclear command surface? `cmdmap` scans package scripts, Makefiles, Justfiles, Taskfiles, Cargo, pyproject, README snippets, and `scripts/` without executing them.
2. The fixture demo finds safe verification commands, long-running dev-server candidates, and risky publish/secret/destructive commands in one report.
3. `cmdmap scan fixtures/polyrepo --out COMMANDS.md` creates a command handoff humans can review; `--format json` gives agents the same evidence in a structured artifact.
4. Run `bash demo/run-polyrepo-scan.sh` to see a local command map with file and line evidence for every finding.
5. A CI risk gate can run `cmdmap scan . --format json --fail-on risky` and upload the JSON report for review when risky command surfaces appear.

## Video Beat

- Open `fixtures/polyrepo/package.json`, `Makefile`, and `README.md`.
- Run `bash demo/run-polyrepo-scan.sh`.
- Show `.tmp/demo-polyrepo-scan/COMMANDS.md`.
- Point to the summary counts and recommended verification path.
- Close by showing one risky command with its source line evidence.
- Optional follow-up: run `bash demo/run-ci-risk-gate.sh` and show the expected
  exit-code `2` path for the risky fixture.

## Guardrails

- Do not claim `cmdmap` proves a command is safe.
- Keep the story on static command discovery and reviewable evidence.
- Mention that discovered commands are not executed during scanning.
