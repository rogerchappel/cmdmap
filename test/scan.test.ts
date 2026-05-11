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
