import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const cli = "dist/src/cli.js";
const fixture = "fixtures/polyrepo";

function run(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}

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

test("cli rejects unknown commands and options with usage on stderr", () => {
  for (const args of [["scna"], ["scan", fixture, "--unknown-option"], ["rules", "--format", "json"]]) {
    const result = run(...args);
    assert.equal(result.status, 1, args.join(" "));
    assert.match(result.stderr, /cmdmap:/);
    assert.match(result.stderr, /Usage:/);
  }
});

test("cli rejects missing option values", () => {
  for (const option of ["--format", "--out", "--fail-on", "--config"]) {
    const result = run("scan", fixture, option);
    assert.equal(result.status, 1, option);
    assert.match(result.stderr, new RegExp(`${option} requires a value`));
    assert.match(result.stderr, /Usage:/);
  }
});

test("cli rejects invalid formats and fail thresholds", () => {
  for (const [option, value] of [["--format", "yaml"], ["--fail-on", "riskyy"]]) {
    const result = run("scan", fixture, option, value);
    assert.equal(result.status, 1, `${option} ${value}`);
    assert.match(result.stderr, new RegExp(`Invalid ${option}`));
    assert.match(result.stderr, /Usage:/);
  }
});

test("cli accepts inline and separated option values", () => {
  const inline = run("scan", fixture, "--format=json");
  const separated = run("scan", fixture, "--format", "json");
  assert.equal(inline.status, 0);
  assert.equal(separated.status, 0);
  assert.deepEqual(JSON.parse(inline.stdout), JSON.parse(separated.stdout));
});

test("every documented fail threshold enforces its severity gate", () => {
  for (const threshold of ["risky", "risky-release", "caution"]) {
    const result = run("scan", fixture, "--format=json", `--fail-on=${threshold}`);
    assert.equal(result.status, 2, threshold);
    assert.ok(JSON.parse(result.stdout).summary.risky > 0);
  }
});

test("a misspelled fail threshold cannot silently pass a risky scan", () => {
  const result = run("scan", fixture, "--format=json", "--fail-on=riskyy");
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Invalid --fail-on/);
});
