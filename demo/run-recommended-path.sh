#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.tmp/recommended-path-demo"
JSON="$OUT/polyrepo-command-map.json"
MD="$OUT/recommended-path.md"

rm -rf "$OUT"
mkdir -p "$OUT"

npm run build >/dev/null

node "$ROOT/dist/src/cli.js" scan "$ROOT/fixtures/polyrepo" --format json --out "$JSON"

node --input-type=module - "$JSON" "$MD" <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs';

const [, , jsonPath, outPath] = process.argv;
const report = JSON.parse(readFileSync(jsonPath, 'utf8'));
const lines = [
  '# cmdmap Recommended Path',
  '',
  `Source root: ${report.root}`,
  `Recommended commands: ${report.recommendedPath.length}`,
  ''
];

for (const finding of report.recommendedPath) {
  lines.push(`## ${finding.command}`);
  lines.push('');
  lines.push(`- Severity: ${finding.severity}`);
  lines.push(`- Runner: ${finding.runner}`);
  lines.push(`- Evidence: ${finding.evidence.file}:${finding.evidence.line}`);
  lines.push(`- Why: ${finding.safetyNotes.join(' ')}`);
  lines.push('');
}

writeFileSync(outPath, `${lines.join('\n')}\n`);
NODE

grep -q '"recommendedPath"' "$JSON"
grep -q "eslint ." "$MD"
grep -q "cargo test" "$MD"
grep -q "Recommended commands:" "$MD"

echo "Command map JSON: $JSON"
echo "Recommended path brief: $MD"
