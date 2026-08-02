#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const expectedPackageName = "@rogerchappel/cmdmap";
const expectedBinName = "cmdmap";
const tempDir = await mkdtemp(join(tmpdir(), "cmdmap-pack-smoke-"));

try {
  if (packageJson.name !== expectedPackageName) {
    throw new Error(`package name ${packageJson.name} did not match ${expectedPackageName}`);
  }
  if (packageJson.bin?.[expectedBinName] !== "./dist/src/cli.js") {
    throw new Error(`package bin ${expectedBinName} did not point to ./dist/src/cli.js`);
  }

  const readme = await readFile("README.md", "utf8");
  const unsupportedRegistryCommands = [
    `npm install --global ${expectedPackageName}`,
    `npx --yes ${expectedPackageName}`
  ];
  for (const command of unsupportedRegistryCommands) {
    if (readme.includes(command)) {
      throw new Error(`README presented unavailable registry command as runnable: ${command}`);
    }
  }

  const tarballName = `rogerchappel-cmdmap-${packageJson.version}.tgz`;
  const documentedCommands = [
    "npm ci",
    "npm run build",
    "npm pack",
    `npm install --prefix .cmdmap-local ./${tarballName}`,
    "./.cmdmap-local/node_modules/.bin/cmdmap --help"
  ];
  for (const command of documentedCommands) {
    if (!readme.includes(command)) {
      throw new Error(`README did not document pre-release command: ${command}`);
    }
  }

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

  const tarballPath = join(tempDir, pack.filename);
  const packedManifest = JSON.parse(
    execFileSync("tar", ["-xOf", tarballPath, "package/package.json"], {
      encoding: "utf8"
    })
  );
  if (packedManifest.name !== expectedPackageName) {
    throw new Error(`packed manifest name ${packedManifest.name} did not match ${expectedPackageName}`);
  }
  if (packedManifest.bin?.[expectedBinName] !== "./dist/src/cli.js") {
    throw new Error(`packed manifest bin ${expectedBinName} did not match the documented CLI`);
  }

  const installDir = join(tempDir, "install");
  execFileSync("npm", ["install", "--prefix", installDir, tarballPath], {
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
