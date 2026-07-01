# Launch Note Draft: Copied Command Review

`cmdmap explain` now has a focused demo path for reviewing one command before
running it.

## What to show

- `demo/run-explain-commands.sh` builds the CLI and explains both `npm test`
  and `npm publish --access public`.
- `.tmp/explain-commands-demo/npm-test.md` shows a safe verification-oriented
  command.
- `.tmp/explain-commands-demo/npm-publish.md` shows release/publish wording as
  a risky signal.
- `docs/tutorials/review-a-copied-command.md` gives the reviewer checklist.

## Short posts

- Before pasting a command into a shell, run `cmdmap explain "<command>"` and
  get a tiny Markdown safety report.
- Static review is a pause, not a sandbox. `cmdmap explain` flags publish,
  secret, destructive, and network-looking signals so a human can review them.
- Use `cmdmap scan` for the whole repo and `cmdmap explain` for the one copied
  command you are about to decide on.

## Demo CTA

```sh
bash demo/run-explain-commands.sh
```

## Guardrails

- Do not claim runtime enforcement.
- Do not claim a safe label is permission to run a command unattended.
- Keep the proof grounded in generated Markdown reports and source evidence.
