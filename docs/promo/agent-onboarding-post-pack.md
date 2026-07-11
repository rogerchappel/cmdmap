# Agent Onboarding Post Pack

Grounded post drafts for the polyrepo command-map demo.

## Short Posts

1. Before an agent runs `npm test` or guesses at a release script, give it a command map. `cmdmap scan` finds scripts, Make targets, Just recipes, Taskfile tasks, Cargo defaults, pyproject entries, README snippets, and shell scripts without executing them.
2. The checked-in `fixtures/polyrepo` demo shows why static command discovery matters: safe verification commands, caution-worthy dev servers, and risky publish/secret/destructive paths appear in one report.
3. Markdown for reviewers, JSON for tools: `cmdmap scan fixtures/polyrepo --out COMMANDS.md` and `cmdmap scan fixtures/polyrepo --format json` describe the same command surface.
4. `bash demo/run-polyrepo-scan.sh` is the quickest way to record the story: build the CLI, scan the fixture, print the summary, and write demo artifacts under `.tmp/demo-polyrepo-scan/`.

## Thread Outline

- New repo context is usually scattered across package scripts, docs, task runners, and shell files.
- `cmdmap` keeps the first pass static so discovery is separate from execution.
- The polyrepo fixture demonstrates safe, caution, and risky classes with source evidence.
- The output can become a PR handoff, onboarding note, or CI artifact.
- The limitation is important: risk labels are heuristic and still need maintainer review.

## Recording Close

End on a risky finding with its source line, then say: "The win is not automatic trust. The win is knowing what needs review before anything runs."
