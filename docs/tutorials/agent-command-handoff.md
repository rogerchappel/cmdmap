# Build an agent command handoff

Use this recipe when a reviewer wants to give an agent a small, evidence-backed
set of commands instead of handing over an entire repository.

## Run the demo

```bash
bash demo/run-agent-handoff.sh
```

The script scans `fixtures/polyrepo`, writes the full command map, keeps the JSON
report, and creates `.tmp/demo-agent-handoff/agent-handoff.md`.

## What to review

The handoff starts with the same summary that `cmdmap scan` emits: counts for
safe, caution, and risky commands. The "Recommended First Runs" section is built
from `recommendedPath`, so it only lists commands that the scanner classified as
safe verification candidates.

The "Commands To Review Before Running" section lists the first risky findings
with their safety notes. That makes it suitable for a PR comment, issue handoff,
or agent task brief where maintainers want to preserve the review boundary.

## Verification

The demo verifies that:

- the Markdown handoff was created;
- the JSON report includes `recommendedPath`;
- the generated handoff includes a recommended-run section.

This keeps the example runnable without executing any discovered project
commands from the fixture.
