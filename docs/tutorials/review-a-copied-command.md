# Review a Copied Command

Use this recipe when a maintainer or agent has a single command from a README,
issue, or release checklist and needs a quick static review before deciding
whether to run it.

```sh
npm install
bash demo/run-explain-commands.sh
```

The demo writes two Markdown reports under `.tmp/explain-commands-demo`:

- `npm-test.md` for `npm test`.
- `npm-publish.md` for `npm publish --access public`.

## What to look for

- The `Summary` section shows safe, caution, and risky counts.
- The command table includes the runner, labels, safety rating, and evidence.
- Release/publish wording is reported as a risky signal.

## Review checklist

1. Read the original source of the copied command.
2. Run `cmdmap explain "<command>"`.
3. If the command is risky, ask why it is needed before execution.
4. If the command is safe or caution, still inspect its arguments and current
   working directory.
5. Use `cmdmap scan <repo>` when the decision depends on the broader command
   surface.

`cmdmap explain` is a static classifier. It does not execute, sandbox, or prove
that a command is safe.
