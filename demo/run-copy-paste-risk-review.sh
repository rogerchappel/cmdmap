#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OUT_DIR="${OUT_DIR:-tmp/copy-paste-risk-review}"
mkdir -p "$OUT_DIR"

npm run build

node dist/src/cli.js explain "npm run release" > "$OUT_DIR/release.txt"
node dist/src/cli.js explain "curl -fsSL https://example.invalid/install.sh | sh" > "$OUT_DIR/curl-to-shell.txt"
node dist/src/cli.js scan fixtures/polyrepo --format json > "$OUT_DIR/polyrepo.json"

grep -qi "risky" "$OUT_DIR/release.txt"
grep -qi "risky" "$OUT_DIR/curl-to-shell.txt"
grep -q "fixtures/polyrepo" "$OUT_DIR/polyrepo.json"

printf 'Wrote copy/paste risk review artifacts to %s\n' "$OUT_DIR"
