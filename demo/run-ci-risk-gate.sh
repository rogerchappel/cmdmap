#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.tmp/demo-ci-risk-gate"

rm -rf "$OUT"
mkdir -p "$OUT"

npm run build

echo "== write JSON command artifact =="
node "$ROOT/dist/src/cli.js" scan "$ROOT/fixtures/polyrepo" --format json --out "$OUT/commands.json"
node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(data.summary);" "$OUT/commands.json"

echo
echo "== run fail-on risky gate =="
set +e
node "$ROOT/dist/src/cli.js" scan "$ROOT/fixtures/polyrepo" --format json --fail-on risky > "$OUT/fail-on-risky.json"
status=$?
set -e
echo "$status" > "$OUT/fail-on-risky.exit"
echo "exit code: $status"

if [[ "$status" -ne 2 ]]; then
  echo "expected --fail-on risky to exit 2, got $status" >&2
  exit 1
fi

node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (!data.findings.some(f => f.severity === 'risky')) process.exit(1); console.log(data.summary);" "$OUT/fail-on-risky.json"
grep -q '"severity": "risky"' "$OUT/fail-on-risky.json"

cat > "$OUT/github-actions-step.md" <<'EOF'
```yaml
- run: npm ci
- run: npm run build
- run: node dist/src/cli.js scan . --format json --fail-on risky > command-map.json
- uses: actions/upload-artifact@v4
  with:
    name: command-map
    path: command-map.json
```
EOF

echo
echo "Demo artifacts written to $OUT"
echo "  $OUT/commands.json"
echo "  $OUT/fail-on-risky.json"
echo "  $OUT/fail-on-risky.exit"
echo "  $OUT/github-actions-step.md"
