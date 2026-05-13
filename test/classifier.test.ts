import assert from "node:assert/strict";
import test from "node:test";
import { explainCommand } from "../src/index.js";

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
