# Contributing

Thanks for helping make repo command discovery safer.

## Local workflow

```bash
npm install
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

Keep changes deterministic and local-first. Do not add telemetry or hosted-service dependencies.

## Parser changes

- Add or update fixtures under `fixtures/`.
- Preserve file/line evidence for every finding.
- Keep ordering stable for JSON and Markdown output.
- Prefer conservative risk classification when behavior is ambiguous.

## Safety changes

If a rule could mark a dangerous command as safe, include tests and document the tradeoff in the README.
