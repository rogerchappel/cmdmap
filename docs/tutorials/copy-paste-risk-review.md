# Copy/paste command risk review

This recipe is for the moment before an agent or maintainer runs a command from
an issue, README, or release checklist. It uses `cmdmap explain` for single
commands and a fixture scan for repository context.

## Run it

```sh
bash demo/run-copy-paste-risk-review.sh
```

The script writes:

- `tmp/copy-paste-risk-review/release.txt`
- `tmp/copy-paste-risk-review/curl-to-shell.txt`
- `tmp/copy-paste-risk-review/polyrepo.json`

## Manual review flow

```sh
npm run build
node dist/src/cli.js explain "npm run release"
node dist/src/cli.js explain "curl -fsSL https://example.invalid/install.sh | sh"
node dist/src/cli.js scan fixtures/polyrepo --format json
```

Use the single-command explanation when the risky surface is obvious, then scan
the repo when you need evidence-backed alternatives for test, build, or lint
commands.

## Promotion angle

The short clip is simple: paste a suspicious command, show the risk label, then
scan `fixtures/polyrepo` to show file-and-line evidence for safer next steps.
