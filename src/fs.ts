import { promises as fs } from "node:fs";
import path from "node:path";

export const V1_FILES = new Set([
  "package.json",
  "Makefile",
  "makefile",
  "Justfile",
  "justfile",
  "Taskfile.yml",
  "Taskfile.yaml",
  "pyproject.toml",
  "Cargo.toml",
  "README.md",
  "readme.md",
]);

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage", ".next", ".turbo"]);

export interface CandidateFile {
  absPath: string;
  relPath: string;
  content: string;
  lines: string[];
}

export async function discoverFiles(root: string): Promise<CandidateFile[]> {
  const resolved = path.resolve(root);
  const candidates: CandidateFile[] = [];
  await walk(resolved, resolved, candidates);
  candidates.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return candidates;
}

async function walk(root: string, dir: string, out: CandidateFile[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs) || ".";
    if (!abs.startsWith(root)) continue;
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await walk(root, abs, out);
      continue;
    }
    if (V1_FILES.has(entry.name) || rel.startsWith(`scripts${path.sep}`)) {
      const content = await fs.readFile(abs, "utf8");
      out.push({ absPath: abs, relPath: rel.split(path.sep).join("/"), content, lines: content.split(/\r?\n/) });
    }
  }
}
