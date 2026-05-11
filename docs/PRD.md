# CmdMap PRD

Status: in-progress

## Summary

A local CLI that turns messy repo command surfaces into an agent-safe command map: what exists, what is risky, what is verified, and what to run first. 🗺️

## Source attribution

Created during the twice-daily OSS factory run on 2026-05-11 after the existing idea pool had fewer than five unbuilt, fast V1 candidates. Web search was attempted but rate-limited, so this is reframed from repeated local OSS factory pain: agents need deterministic command discovery from `package.json`, `Makefile`, `Justfile`, `Taskfile.yml`, `pyproject.toml`, `Cargo.toml`, and shell scripts without guessing or running dangerous tasks.

## Target users

- Developers onboarding to unfamiliar repos.
- Agentic coding systems that need safe local command choices.
- Maintainers who want a concise command inventory in docs or CI artifacts.

## Problem

Repos hide their real workflows across package scripts, Makefiles, task runners, and docs. Humans skim; agents guess. The result is wasted time, unsafe commands, skipped tests, and brittle handoffs.

## Goals

- Discover common project commands offline.
- Classify commands as test, build, lint, dev server, release, publish, destructive, networked, or unknown.
- Produce Markdown and JSON command maps with evidence and safety notes.
- Recommend a minimal verification path.
- Include fixture-backed tests and real CLI smokes.

## Non-goals

- Executing discovered commands in V1.
- Perfect shell static analysis.
- Replacing project-specific documentation.
- Calling hosted services or telemetry.

## V1 CLI

```bash
cmdmap scan . --out docs/COMMANDS.md
cmdmap scan fixtures/polyrepo --format json --fail-on risky-release
cmdmap explain "npm run release"
```

## Functional requirements

1. Parse `package.json`, `Makefile`, `Justfile`, `Taskfile.yml`, `pyproject.toml`, `Cargo.toml`, `README.md`, and `scripts/*` names.
2. Classify commands with transparent heuristics and confidence levels.
3. Flag publish/release/delete/secrets/network-looking commands as risky unless explicitly allowed.
4. Emit stable Markdown and JSON with file/line evidence.
5. Support config for allowlists, custom labels, ignored commands, and preferred smoke path.
6. Include fixtures for npm, make, just, Python, and mixed repos.

## Acceptance criteria

- `npm test`, `npm run check`, `npm run build`, and `npm run smoke` pass.
- `bash scripts/validate.sh` passes when present.
- Real CLI smoke scans checked-in fixtures and writes a command map.
- README covers quick start, safety model, examples, config, and limitations.
- Public GitHub repo `rogerchappel/cmdmap` has useful description and topics.

## Suggested implementation waves

1. Scaffold TypeScript CLI with StackForge and planning docs.
2. Implement file discovery, parsers, and line evidence.
3. Implement classifier, reporters, config, and CLI.
4. Add fixtures, tests, smoke scripts, validation.
5. Polish README, metadata, GitHub topics, and branch protection.
