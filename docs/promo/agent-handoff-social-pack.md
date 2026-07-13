# Agent Handoff Social Pack

## Core angle

`cmdmap` can turn a messy repo command surface into a small handoff: safe first
runs, risky commands to review, and file/line evidence for every finding.

## Short posts

1. Before asking an agent to work in a repo, give it a command map. `cmdmap`
   scans package scripts, Makefiles, Justfiles, Taskfiles, Python metadata,
   Cargo defaults, README snippets, and `scripts/` files without executing them.

2. New demo: `bash demo/run-agent-handoff.sh` creates a Markdown handoff from
   the polyrepo fixture with safe first-run commands and risky commands that
   still need human review.

3. The important bit is the boundary: `cmdmap` recommends verification commands
   but does not run discovered commands. The output is a map for reviewers and
   agents, not permission to automate everything.

## Video outline

- Show `fixtures/polyrepo` with several command surfaces.
- Run `bash demo/run-agent-handoff.sh`.
- Open `.tmp/demo-agent-handoff/agent-handoff.md`.
- Point out the safe/caution/risky counts.
- Close on the risky command section and its file/line evidence.

## Grounding notes

- Demo command: `bash demo/run-agent-handoff.sh`
- Fixture: `fixtures/polyrepo`
- Output files: `.tmp/demo-agent-handoff/COMMANDS.md`,
  `.tmp/demo-agent-handoff/commands.json`, and
  `.tmp/demo-agent-handoff/agent-handoff.md`
- Limitation: the scanner is static and does not execute or verify discovered
  commands.
