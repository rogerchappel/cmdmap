import { promises as fs } from "node:fs";
import path from "node:path";
import type { CmdMapConfig } from "./types.js";

export async function loadConfig(root: string, configPath?: string): Promise<CmdMapConfig> {
  const candidates = configPath ? [configPath] : [".cmdmaprc.json", "cmdmap.config.json"];
  for (const candidate of candidates) {
    const abs = path.resolve(root, candidate);
    try {
      const parsed = JSON.parse(await fs.readFile(abs, "utf8")) as CmdMapConfig;
      return {
        allowRisky: parsed.allowRisky ?? [],
        ignore: parsed.ignore ?? [],
        labels: parsed.labels ?? {},
        preferredSmokePath: parsed.preferredSmokePath ?? [],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw new Error(`Invalid cmdmap config at ${candidate}: ${(error as Error).message}`);
    }
  }
  return { allowRisky: [], ignore: [], labels: {}, preferredSmokePath: [] };
}
