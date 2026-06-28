#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.tmp/explain-commands-demo"

mkdir -p "$OUT"

npm run build

echo "== explain a safe verification command =="
node "$ROOT/dist/src/cli.js" explain "npm test" > "$OUT/npm-test.md"
sed -n '1,24p' "$OUT/npm-test.md"

echo
echo "== explain a risky release command =="
node "$ROOT/dist/src/cli.js" explain "npm publish --access public" > "$OUT/npm-publish.md"
sed -n '1,24p' "$OUT/npm-publish.md"

grep -q "Safe: 1" "$OUT/npm-test.md"
grep -q "Risky: 1" "$OUT/npm-publish.md"
grep -q "Release/publish wording detected" "$OUT/npm-publish.md"

echo
echo "Demo explanations written to $OUT"
