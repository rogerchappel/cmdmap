import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

async function withPyproject(content: string, run: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), "cmdmap-pyproject-"));
  try {
    await writeFile(path.join(root, "pyproject.toml"), content);
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("scan distinguishes installed Python scripts from Poe task commands", async () => {
  const manifest = `[project.scripts]\nverify = "demo.cli:main"\n\n[tool.poetry.scripts]\n"serve-local" = "demo.server:start"\n\n[tool.poe.tasks]\ncheck = "pytest -q"\n`;
  await withPyproject(manifest, async (root) => {
    const first = await scan({ cwd: root });
    const second = await scan({ cwd: root });

    assert.deepEqual(first.findings.map(({ name, command, runner, severity, evidence }) => ({ name, command, runner, severity, evidence })), [
      { name: "check", command: "pytest -q", runner: "poe", severity: "safe", evidence: { file: "pyproject.toml", line: 8, source: 'check = "pytest -q"' } },
      { name: "serve-local", command: "serve-local", runner: "python", severity: "caution", evidence: { file: "pyproject.toml", line: 5, source: '"serve-local" = "demo.server:start"' } },
      { name: "verify", command: "verify", runner: "python", severity: "caution", evidence: { file: "pyproject.toml", line: 2, source: 'verify = "demo.cli:main"' } },
    ]);
    assert.deepEqual(first.findings.map((finding) => finding.id), second.findings.map((finding) => finding.id));
  });
});

test("scan ignores unsupported and malformed pyproject script values", async () => {
  const manifest = `[project.scripts]\nvalid = "demo.cli:main"\ninvalid-array = ["demo.cli:main"]\ninvalid-table = { call = "demo.cli:main" }\ninvalid-bare = demo.cli:main\n\n[tool.poe.tasks]\nvalid-task = "ruff check"\ncomplex-task = { cmd = "pytest" }\nunterminated = "pytest\n`;
  await withPyproject(manifest, async (root) => {
    const result = await scan({ cwd: root });
    assert.deepEqual(result.findings.map(({ name, command, runner }) => ({ name, command, runner })), [
      { name: "valid-task", command: "ruff check", runner: "poe" },
      { name: "valid", command: "valid", runner: "python" },
    ]);
  });
});

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

test("scan skips generated environments while preserving nested workspaces", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "cmdmap-generated-"));
  const manifests = new Map([
    ["packages/api", "node --test"],
    [".venv/example", "npm publish"],
    ["venv/example", "npm publish"],
    [".tox/example", "npm publish"],
    [".nox/example", "npm publish"],
    ["node_modules/example", "npm publish"],
    ["dist/example", "npm publish"],
    ["target/example", "npm publish"],
  ]);

  try {
    for (const [directory, command] of manifests) {
      const destination = path.join(root, directory);
      await mkdir(destination, { recursive: true });
      await writeFile(path.join(destination, "package.json"), JSON.stringify({ scripts: { test: command } }));
    }

    const result = await scan({ cwd: root });
    assert.deepEqual(result.findings.map((finding) => [finding.command, finding.evidence.file]), [
      ["node --test", "packages/api/package.json"],
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
