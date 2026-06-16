#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.tmp/demo-polyrepo-scan"

mkdir -p "$OUT"

npm run build

echo "== generate Markdown command map =="
node "$ROOT/dist/src/cli.js" scan "$ROOT/fixtures/polyrepo" --out "$OUT/COMMANDS.md"
sed -n '1,40p' "$OUT/COMMANDS.md"

echo
echo "== generate JSON command map =="
node "$ROOT/dist/src/cli.js" scan "$ROOT/fixtures/polyrepo" --format json > "$OUT/commands.json"
node -e "const fs=require('node:fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); console.log(data.summary);" "$OUT/commands.json"

grep -q 'Safe:' "$OUT/COMMANDS.md"
grep -q 'Caution:' "$OUT/COMMANDS.md"
grep -q 'Risky:' "$OUT/COMMANDS.md"
grep -q '"findings"' "$OUT/commands.json"

echo
echo "Demo artifacts written to $OUT"
