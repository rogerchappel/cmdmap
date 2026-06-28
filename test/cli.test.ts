import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const cli = "dist/src/cli.js";

test("cli prints help without scanning", () => {
  const result = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /cmdmap - map repo commands safely/);
  assert.match(result.stdout, /cmdmap scan <path>/);
});

test("cli prints package version", () => {
  const result = spawnSync(process.execPath, [cli, "--version"], { encoding: "utf8" });
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), pkg.version);
});
