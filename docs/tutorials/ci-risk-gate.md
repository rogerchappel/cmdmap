# CI Risk Gate Recipe

Use this recipe when a repository wants a reviewable command map and a simple
CI signal for risky command surfaces.

## Run the Local Demo

```sh
npm install
bash demo/run-ci-risk-gate.sh
```

The demo scans `fixtures/polyrepo`, writes JSON artifacts under
`.tmp/demo-ci-risk-gate/`, and verifies that `--fail-on risky` exits with code
`2` because the fixture includes risky release, secret, and destructive command
examples.

## GitHub Actions Step

```yaml
- run: npm ci
- run: npm run build
- run: node dist/src/cli.js scan . --format json --fail-on risky > command-map.json
- uses: actions/upload-artifact@v4
  with:
    name: command-map
    path: command-map.json
```

## How to Read the Result

- Exit `0`: no findings at or above the configured fail level.
- Exit `2`: at least one finding met the configured fail level.
- `command-map.json`: structured evidence for humans or agents to review.

## Guardrails

- `cmdmap scan` does not execute discovered commands.
- A risky label is a review signal, not proof that a command is wrong.
- Keep reviewed exceptions in project configuration instead of ignoring the
  generated report.
