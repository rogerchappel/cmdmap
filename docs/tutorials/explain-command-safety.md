# Explain Command Safety

This recipe uses `cmdmap explain` for quick command review before running a
script copied from a README, issue, or release checklist.

## Run the demo

```sh
npm install
bash demo/run-explain-commands.sh
```

The script builds the CLI, explains one verification-oriented command and one
release-oriented command, then verifies the expected safety summaries.

## Commands covered

- `npm test` is classified as a safe verification candidate.
- `npm publish --access public` is classified as risky because release/publish
  wording is detected.

## When to use this

Use `cmdmap explain <command>` when you only have a single command to review.
Use `cmdmap scan <repo>` when you want a broader command map across package
scripts, Makefiles, Justfiles, Taskfiles, Cargo manifests, pyproject files,
README snippets, and local scripts.

## Guardrails

- `explain` classifies static text; it does not prove a command is safe.
- Review the command and surrounding repo context before execution.
- Keep publish, secret, destructive, and network-heavy commands out of casual
  smoke-test paths.
