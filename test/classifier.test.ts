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
