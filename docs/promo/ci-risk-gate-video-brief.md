# Video Brief: Command Map CI Risk Gate

## Audience

Maintainers and agent-platform builders who want a reviewable command inventory before automation chooses what to run.

## Core Claim

`cmdmap` can emit a JSON command artifact and return exit code `2` when a static scan finds risky commands.

## 60-Second Flow

1. Open `fixtures/polyrepo/package.json`, `Makefile`, and `scripts/bootstrap.sh`.
2. Run `bash demo/run-ci-risk-gate.sh`.
3. Show `.tmp/demo-ci-risk-gate/commands.json` and the safe/caution/risky summary.
4. Show `.tmp/demo-ci-risk-gate/fail-on-risky.exit` with exit code `2`.
5. Explain that scanning is static and discovered commands are not executed.
6. Close on using the JSON artifact for CI review or agent handoff.

## Hooks

- "Before a bot guesses `npm run release`, give it a command map."
- "`cmdmap scan --fail-on risky` turns release and secret-looking commands into an explicit CI gate."
- "The demo fails on purpose: risky command surfaces are found, not executed."

## Guardrails

- Do not claim `cmdmap` proves a command is safe.
- Do not claim it executes or sandboxes discovered commands.
- Keep the risk-gate example tied to `fixtures/polyrepo` and its checked-in command surfaces.
