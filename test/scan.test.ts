import assert from "node:assert/strict";
import test from "node:test";
import { scan, toMarkdown } from "../src/index.js";

test("scan discovers fixture commands with evidence and risk", async () => {
  const result = await scan({ cwd: "fixtures/polyrepo" });
  const commands = result.findings.map((f) => f.command);
  assert.ok(commands.includes("vitest run"));
  assert.ok(commands.includes("npm publish"));
  assert.ok(commands.includes("make clean"));
  assert.equal(result.findings.find((f) => f.name === "release")?.severity, "risky");
  assert.equal(result.findings.some((f) => f.name === "dev"), false);
  assert.ok(result.findings.every((f) => f.evidence.file && f.evidence.line >= 1));
});

test("markdown report is stable and useful", async () => {
  const result = await scan({ cwd: "fixtures/polyrepo" });
  const md = toMarkdown(result);
  assert.match(md, /# Command Map/);
  assert.match(md, /Recommended verification path/);
  assert.match(md, /package.json/);
});

test("scan preserves colliding workspace scripts with deterministic identities", async () => {
  const first = await scan({ cwd: "fixtures/colliding-workspaces" });
  const second = await scan({ cwd: "fixtures/colliding-workspaces" });
  const tests = first.findings.filter((finding) => finding.runner === "npm" && finding.name === "test");

  assert.deepEqual(tests.map((finding) => [finding.command, finding.evidence.file, finding.evidence.line]), [
    ["node --test", "package.json", 3],
    ["vitest run", "packages/api/package.json", 3],
    ["node --test", "packages/web/package.json", 3],
  ]);
  assert.equal(new Set(tests.map((finding) => finding.id)).size, 3);
  assert.deepEqual(first.findings.map((finding) => finding.id), second.findings.map((finding) => finding.id));
  assert.deepEqual(first.summary, { safe: 4, caution: 0, risky: 1 });
  assert.deepEqual(first.recommendedPath.map((finding) => [finding.name, finding.evidence.file]), [
    ["test", "package.json"],
    ["lint", "packages/api/package.json"],
    ["test", "packages/api/package.json"],
  ]);
});
