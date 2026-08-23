import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
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

async function withManifest(content: string, run: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), "cmdmap-manifest-"));
  try {
    await writeFile(path.join(root, "package.json"), content);
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("scan identifies malformed package manifests", async () => {
  await withManifest('{"scripts": {"test": "node test.js"}', async (root) => {
    await assert.rejects(scan({ cwd: root }), /Invalid package\.json .*package\.json: .*position/);
  });
});

test("scan rejects non-object package scripts", async () => {
  await withManifest('{"scripts": ["npm test"]}', async (root) => {
    await assert.rejects(scan({ cwd: root }), /Invalid package\.json .*package\.json: "scripts" must be an object/);
  });
});

test("scan rejects a non-object package manifest", async () => {
  await withManifest('[{"scripts":{"test":"node test.js"}}]', async (root) => {
    await assert.rejects(scan({ cwd: root }), /Invalid package\.json .*package\.json: manifest must be an object/);
  });
});

test("scan rejects non-string package script commands with exact evidence", async () => {
  await withManifest('{\n  "scripts": {\n    "test": 42\n  }\n}\n', async (root) => {
    await assert.rejects(scan({ cwd: root }), /Invalid package\.json .*package\.json: script "test" on line 3 must be a string/);
  });
});

test("CLI reports the offending manifest and script", async () => {
  await withManifest('{\n  "scripts": {\n    "test": false\n  }\n}\n', async (root) => {
    const result = spawnSync(process.execPath, ["dist/src/cli.js", "scan", root, "--format", "json"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /cmdmap: Invalid package\.json .*package\.json: script "test" on line 3 must be a string/);
  });
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

test("package script evidence points inside scripts when a key name appears earlier", async () => {
  const first = await scan({ cwd: "fixtures/duplicate-package-key" });
  const second = await scan({ cwd: "fixtures/duplicate-package-key" });
  const finding = first.findings.find((candidate) => candidate.runner === "npm" && candidate.name === "test");

  assert.deepEqual(finding?.evidence, {
    file: "package.json",
    line: 4,
    source: '"test": "node --test"',
  });
  assert.deepEqual(first.findings.map((candidate) => candidate.id), second.findings.map((candidate) => candidate.id));
});
