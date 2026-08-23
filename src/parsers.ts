import type { CandidateFile } from "./fs.js";
import type { Evidence } from "./types.js";

export interface RawCommand {
  name: string;
  command: string;
  runner: string;
  evidence: Evidence;
}

export function parseFile(file: CandidateFile): RawCommand[] {
  const basename = file.relPath.split("/").pop() ?? file.relPath;
  if (basename === "package.json") return parsePackageJson(file);
  if (/^makefile$/i.test(basename)) return parseMakefile(file);
  if (/^justfile$/i.test(basename)) return parseJustfile(file);
  if (/^Taskfile\.ya?ml$/.test(basename)) return parseTaskfile(file);
  if (basename === "pyproject.toml") return parsePyproject(file);
  if (basename === "Cargo.toml") return parseCargo(file);
  if (/^readme\.md$/i.test(basename)) return parseReadme(file);
  if (file.relPath.startsWith("scripts/")) return parseScriptName(file);
  return [];
}

function evidence(file: CandidateFile, line: number): Evidence {
  return { file: file.relPath, line, source: file.lines[line - 1]?.trim() ?? "" };
}

function parsePackageJson(file: CandidateFile): RawCommand[] {
  const out: RawCommand[] = [];
  let data: unknown;
  try {
    data = JSON.parse(file.content);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid package.json ${file.relPath}: ${detail}`);
  }
  if (!isRecord(data)) {
    throw new Error(`Invalid package.json ${file.relPath}: manifest must be an object`);
  }
  const scripts = data.scripts;
  if (scripts === undefined) return out;
  if (!isRecord(scripts)) {
    throw new Error(`Invalid package.json ${file.relPath}: "scripts" must be an object`);
  }
  for (const [name, command] of Object.entries(scripts)) {
    const line = findPackageScriptLine(file, name);
    if (typeof command !== "string") {
      throw new Error(`Invalid package.json ${file.relPath}: script "${name}" on line ${line} must be a string`);
    }
    out.push({ name, command, runner: "npm", evidence: evidence(file, line) });
  }
  return out;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMakefile(file: CandidateFile): RawCommand[] {
  return file.lines.flatMap((line, index) => {
    const match = /^([A-Za-z0-9_.-]+)\s*:(?![=])/.exec(line);
    if (!match || match[1].startsWith(".")) return [];
    return [{ name: match[1], command: `make ${match[1]}`, runner: "make", evidence: evidence(file, index + 1) }];
  });
}

function parseJustfile(file: CandidateFile): RawCommand[] {
  return file.lines.flatMap((line, index) => {
    const match = /^([A-Za-z0-9_-]+)(?:\s+[^:]*)?:\s*$/.exec(line);
    if (!match) return [];
    return [{ name: match[1], command: `just ${match[1]}`, runner: "just", evidence: evidence(file, index + 1) }];
  });
}

function parseTaskfile(file: CandidateFile): RawCommand[] {
  const out: RawCommand[] = [];
  let inTasks = false;
  for (let index = 0; index < file.lines.length; index++) {
    const line = file.lines[index];
    if (/^tasks:\s*$/.test(line)) { inTasks = true; continue; }
    if (inTasks) {
      const match = /^\s{2}([A-Za-z0-9_.-]+):\s*$/.exec(line);
      if (match) out.push({ name: match[1], command: `task ${match[1]}`, runner: "task", evidence: evidence(file, index + 1) });
      if (/^\S/.test(line) && !/^tasks:/.test(line)) inTasks = false;
    }
  }
  return out;
}

function parsePyproject(file: CandidateFile): RawCommand[] {
  const out: RawCommand[] = [];
  let section = "";
  for (let index = 0; index < file.lines.length; index++) {
    const line = file.lines[index].trim();
    const header = /^\[([^\]]+)\]/.exec(line);
    if (header) section = header[1];
    const script = /^([A-Za-z0-9_.-]+)\s*=\s*["']([^"']+)["']/.exec(line);
    if (script && ["project.scripts", "tool.poetry.scripts", "tool.poe.tasks"].includes(section)) {
      out.push({ name: script[1], command: script[2], runner: "python", evidence: evidence(file, index + 1) });
    }
  }
  return out;
}

function parseCargo(file: CandidateFile): RawCommand[] {
  const out: RawCommand[] = [
    { name: "build", command: "cargo build", runner: "cargo", evidence: evidence(file, 1) },
    { name: "test", command: "cargo test", runner: "cargo", evidence: evidence(file, 1) },
  ];
  file.lines.forEach((line, index) => {
    if (/^\[package\]/.test(line)) out.push({ name: "publish", command: "cargo publish", runner: "cargo", evidence: evidence(file, index + 1) });
  });
  return out;
}

function parseReadme(file: CandidateFile): RawCommand[] {
  const out: RawCommand[] = [];
  file.lines.forEach((line, index) => {
    const match = /^\s*(?:[$>]\s*)?(npm run [A-Za-z0-9:_-]+|pnpm [A-Za-z0-9:_-]+|yarn [A-Za-z0-9:_-]+|make [A-Za-z0-9_.-]+|just [A-Za-z0-9_-]+|cargo (?:build|test|publish)|pytest|ruff check)\s*$/.exec(line.trim());
    if (match) out.push({ name: match[1], command: match[1], runner: "docs", evidence: evidence(file, index + 1) });
  });
  return out;
}

function parseScriptName(file: CandidateFile): RawCommand[] {
  const name = file.relPath.replace(/^scripts\//, "");
  const executable = name.replace(/\.(sh|bash|js|mjs|ts|py)$/, "");
  return [{ name: executable, command: file.relPath, runner: "script", evidence: evidence(file, 1) }];
}

function findPackageScriptLine(file: CandidateFile, scriptName: string): number {
  const tokens: Array<{ value: string; offset: number; end: number; depth: number }> = [];
  let depth = 0;

  for (let offset = 0; offset < file.content.length;) {
    const character = file.content[offset];
    if (character === "{") { depth++; offset++; continue; }
    if (character === "}") { depth--; offset++; continue; }
    if (character !== '"') { offset++; continue; }

    const start = offset++;
    while (offset < file.content.length) {
      if (file.content[offset] === "\\") { offset += 2; continue; }
      if (file.content[offset++] === '"') break;
    }
    const raw = file.content.slice(start, offset);
    tokens.push({ value: JSON.parse(raw) as string, offset: start, end: offset, depth });
  }

  const isKey = (token: { end: number }): boolean => /^\s*:/.test(file.content.slice(token.end));
  const scripts = tokens.find((token) => token.depth === 1 && token.value === "scripts" && isKey(token));
  const script = scripts && tokens.find((token) => token.offset > scripts.offset && token.depth === 2 && token.value === scriptName && isKey(token));
  if (!script) return 1;
  return file.content.slice(0, script.offset).split(/\r?\n/).length;
}
