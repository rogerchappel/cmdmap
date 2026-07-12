#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const tempDir = await mkdtemp(join(tmpdir(), "cmdmap-pack-smoke-"));

try {
  const output = execFileSync(
    "npm",
    ["pack", "--pack-destination", tempDir, "--json"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"]
    }
  );

  const [pack] = JSON.parse(output);
  const publishedFiles = new Set(pack.files.map((file) => file.path));
  const expectedFiles = [
    "dist/src/cli.js",
    "dist/src/index.js",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md"
  ];
  const missing = expectedFiles.filter((file) => !publishedFiles.has(file));

  if (missing.length > 0) {
    console.error("cmdmap package smoke failed; missing expected file(s):");
    for (const file of missing) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }

  const installDir = join(tempDir, "install");
  execFileSync("npm", ["install", "--prefix", installDir, join(tempDir, pack.filename)], {
    stdio: ["ignore", "ignore", "inherit"]
  });

  const binPath = join(installDir, "node_modules", ".bin", "cmdmap");
  const help = execFileSync(binPath, ["--help"], { encoding: "utf8" });
  if (!help.includes("cmdmap scan")) {
    throw new Error("installed CLI help did not include expected scan usage");
  }

  const version = execFileSync(binPath, ["--version"], { encoding: "utf8" }).trim();
  if (version !== packageJson.version) {
    throw new Error(`installed CLI version ${version} did not match package ${packageJson.version}`);
  }

  console.log(
    `cmdmap package smoke passed with ${pack.files.length} packed file(s) and installed CLI checks.`
  );
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
