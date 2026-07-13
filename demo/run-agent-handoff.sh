#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.tmp/demo-agent-handoff"

rm -rf "$OUT"
mkdir -p "$OUT"

npm run build

node "$ROOT/dist/src/cli.js" scan "$ROOT/fixtures/polyrepo" --out "$OUT/COMMANDS.md"
node "$ROOT/dist/src/cli.js" scan "$ROOT/fixtures/polyrepo" --format json > "$OUT/commands.json"

node - "$OUT/commands.json" > "$OUT/agent-handoff.md" <<'NODE'
const fs = require("node:fs");
const report = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const recommended = report.recommendedPath.map((item) => `- \`${item.command}\` from ${item.evidence.file}:${item.evidence.line}`);
const risky = report.findings
  .filter((item) => item.severity === "risky")
  .slice(0, 5)
  .map((item) => `- \`${item.command}\` (${item.safetyNotes.join(" ")})`);

console.log("# Agent Command Handoff");
console.log("");
console.log(`Source: ${report.root}`);
console.log("");
console.log("## Summary");
console.log("");
console.log(`- Safe commands: ${report.summary.safe}`);
console.log(`- Caution commands: ${report.summary.caution}`);
console.log(`- Risky commands: ${report.summary.risky}`);
console.log("");
console.log("## Recommended First Runs");
console.log("");
console.log(recommended.length ? recommended.join("\n") : "No safe verification path was detected.");
console.log("");
console.log("## Commands To Review Before Running");
console.log("");
console.log(risky.length ? risky.join("\n") : "No risky commands were detected.");
NODE

grep -q "Agent Command Handoff" "$OUT/agent-handoff.md"
grep -q "Recommended First Runs" "$OUT/agent-handoff.md"
grep -q '"recommendedPath"' "$OUT/commands.json"

echo "Agent handoff artifacts written to $OUT"
echo "  $OUT/COMMANDS.md"
echo "  $OUT/commands.json"
echo "  $OUT/agent-handoff.md"
