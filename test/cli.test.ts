import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
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

test("scan rejects malformed config fields instead of changing results", () => {
  const cases: Array<[unknown, RegExp]> = [
    ["ignore", /root must be a JSON object/],
    [{ allowRisky: "release" }, /allowRisky must be an array of strings/],
    [{ ignore: "release" }, /ignore must be an array of strings/],
    [{ preferredSmokePath: "test" }, /preferredSmokePath must be an array of strings/],
    [{ labels: { test: "test" } }, /labels\.test must be an array of command kinds/],
    [{ labels: { test: ["not-a-kind"] } }, /labels\.test\[0\] must be a recognized command kind/],
  ];
  const directory = mkdtempSync(path.join(tmpdir(), "cmdmap-config-"));
  try {
    for (const [config, diagnostic] of cases) {
      const configPath = path.join(directory, "invalid.json");
      writeFileSync(configPath, JSON.stringify(config));
      const result = run("scan", fixture, "--format=json", "--config", configPath);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, new RegExp(`Invalid cmdmap config at ${escapeRegex(configPath)}`));
      assert.match(result.stderr, diagnostic);
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});

test("explain rejects malformed labels and accepts valid config", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "cmdmap-config-"));
  try {
    const configPath = path.join(directory, "config.json");
    writeFileSync(configPath, JSON.stringify({ labels: { release: "test" } }));
    const invalid = run("explain", "release", "--config", configPath);
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.match(invalid.stderr, /labels\.release must be an array of command kinds/);

    writeFileSync(configPath, JSON.stringify({ allowRisky: ["release"], labels: { release: ["test"] } }));
    const valid = run("explain", "release", "--config", configPath);
    assert.equal(valid.status, 0);
    assert.match(valid.stdout, /- Safe: 1/);
    assert.match(valid.stdout, /\| `release` \| ad-hoc \| test, release \| safe \(high\)/);
  } finally {
    rmSync(directory, { recursive: true });
  }
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
