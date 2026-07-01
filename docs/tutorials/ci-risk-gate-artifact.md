# Capture A CI Risk Gate Artifact

This recipe shows how to use the checked-in `fixtures/polyrepo` sample as a CI-style command map artifact and as a deliberately failing risky-command gate.

## Run The Demo

```bash
bash demo/run-ci-risk-gate.sh
```

The script builds the TypeScript CLI, scans `fixtures/polyrepo`, and writes artifacts under `.tmp/demo-ci-risk-gate/`.

## Outputs

- `commands.json`: structured command map for upload or review.
- `fail-on-risky.json`: scan output from the gate run.
- `fail-on-risky.exit`: expected exit code `2` because the fixture includes risky commands.

## Why The Gate Fails

The polyrepo fixture intentionally includes release, publish, secret, and destructive-looking commands. `cmdmap scan --fail-on risky` does not execute those commands; it exits non-zero because static analysis found risky command surfaces.

## CI Sketch

```yaml
- run: npm ci
- run: npm run build
- run: node dist/src/cli.js scan fixtures/polyrepo --format json --out command-map.json
- run: node dist/src/cli.js scan fixtures/polyrepo --format json --fail-on risky > risky-gate.json
```

Use `continue-on-error: true` around the gate step when you want to upload `risky-gate.json` for review instead of failing the entire workflow immediately.
