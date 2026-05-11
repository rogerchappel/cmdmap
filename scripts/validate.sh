#!/usr/bin/env bash
set -euo pipefail
npm test
npm run check
npm run build
npm run smoke
node dist/src/cli.js scan fixtures/polyrepo --format json --fail-on risky >/tmp/cmdmap-risky.json && {
  echo "expected risky scan to exit non-zero" >&2
  exit 1
} || status=$?
if [ "${status:-0}" -ne 2 ]; then
  echo "expected exit 2 for --fail-on risky, got ${status:-0}" >&2
  exit 1
fi
