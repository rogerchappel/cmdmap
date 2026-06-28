# Explain Command Hooks

Grounded post drafts for the `cmdmap explain` demo.

## Hooks

1. Paste a command into `cmdmap explain` before running it. You get a small
   Markdown report with safe/caution/risky counts and evidence.
2. `cmdmap explain "npm test"` points at a verification candidate; `cmdmap
   explain "npm publish --access public"` flags release wording as risky.
3. Use `cmdmap scan` for a whole repo, or `cmdmap explain` when one copied
   command needs a quick safety read.
4. Static command review is not a sandbox, but it is a useful pause before
   running publish, secret, or destructive commands.

## Demo CTA

```sh
npm run build
bash demo/run-explain-commands.sh
```

## Video Beats

1. Run the demo script.
2. Show `.tmp/explain-commands-demo/npm-test.md`.
3. Show `.tmp/explain-commands-demo/npm-publish.md`.
4. Point to the evidence row and safety summary.
5. Close by contrasting one-command `explain` with repo-wide `scan`.

## Guardrails

- Do not claim the classifier executes or sandboxes commands.
- Keep the message scoped to static command discovery and reviewable evidence.
- Treat risky findings as review signals, not automatic policy decisions.
