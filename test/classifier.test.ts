import assert from "node:assert/strict";
import test from "node:test";
import { explainCommand } from "../src/index.js";
import { classify } from "../src/classifier.js";

test("release commands are risky", () => {
  const finding = explainCommand("npm run release");
  assert.equal(finding.severity, "risky");
  assert.ok(finding.kinds.includes("release"));
});

test("test commands are safe", () => {
  const finding = explainCommand("npm test");
  assert.equal(finding.severity, "safe");
  assert.ok(finding.kinds.includes("test"));
});


test("privileged local system commands are risky", () => {
  const finding = explainCommand("sudo launchctl kickstart gui/501/com.example.agent");
  assert.equal(finding.severity, "risky");
  assert.ok(finding.kinds.includes("privileged"));
  assert.ok(finding.safetyNotes.some((note) => note.includes("Privileged")));
});

test("finding IDs distinguish evidence locations and collapse exact duplicates", () => {
  const base = { name: "test", command: "vitest run", runner: "npm", evidence: { file: "package.json", line: 4, source: '"test": "vitest run"' } };
  assert.equal(classify(base).id, classify(structuredClone(base)).id);
  assert.notEqual(classify(base).id, classify({ ...base, evidence: { ...base.evidence, file: "packages/api/package.json" } }).id);
  assert.notEqual(classify(base).id, classify({ ...base, command: "node --test" }).id);
});
