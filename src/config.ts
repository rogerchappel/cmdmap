import { promises as fs } from "node:fs";
import path from "node:path";
import type { CmdMapConfig, CommandKind } from "./types.js";

const commandKinds = new Set<CommandKind>([
  "test", "build", "lint", "dev-server", "release", "publish", "destructive",
  "networked", "privileged", "secrets", "unknown",
]);

export async function loadConfig(root: string, configPath?: string): Promise<CmdMapConfig> {
  const candidates = configPath ? [configPath] : [".cmdmaprc.json", "cmdmap.config.json"];
  for (const candidate of candidates) {
    const abs = path.resolve(root, candidate);
    try {
      const parsed: unknown = JSON.parse(await fs.readFile(abs, "utf8"));
      return validateConfig(parsed);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw new Error(`Invalid cmdmap config at ${candidate}: ${(error as Error).message}`);
    }
  }
  return { allowRisky: [], ignore: [], labels: {}, preferredSmokePath: [] };
}

function validateConfig(value: unknown): CmdMapConfig {
  if (!isObject(value)) throw new Error("root must be a JSON object");

  const allowRisky = stringArray(value.allowRisky, "allowRisky");
  const ignore = stringArray(value.ignore, "ignore");
  const preferredSmokePath = stringArray(value.preferredSmokePath, "preferredSmokePath");
  const labels = validateLabels(value.labels);
  return { allowRisky, ignore, labels, preferredSmokePath };
}

function stringArray(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array of strings`);
  for (const [index, entry] of value.entries()) {
    if (typeof entry !== "string") throw new Error(`${field}[${index}] must be a string`);
  }
  return value;
}

function validateLabels(value: unknown): Record<string, CommandKind[]> {
  if (value === undefined) return {};
  if (!isObject(value)) throw new Error("labels must be an object of command-kind arrays");

  const labels: Record<string, CommandKind[]> = {};
  for (const [name, kinds] of Object.entries(value)) {
    if (!Array.isArray(kinds)) throw new Error(`labels.${name} must be an array of command kinds`);
    for (const [index, kind] of kinds.entries()) {
      if (typeof kind !== "string" || !commandKinds.has(kind as CommandKind)) {
        throw new Error(`labels.${name}[${index}] must be a recognized command kind`);
      }
    }
    labels[name] = kinds as CommandKind[];
  }
  return labels;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
