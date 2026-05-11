import path from "node:path";
import { classify } from "./classifier.js";
import { loadConfig } from "./config.js";
import { discoverFiles } from "./fs.js";
import { parseFile } from "./parsers.js";
import type { CommandFinding, ScanOptions, ScanResult, Severity } from "./types.js";

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const root = path.resolve(options.cwd);
  const [files, config] = await Promise.all([discoverFiles(root), loadConfig(root, options.configPath)]);
  const ignored = new Set(config.ignore ?? []);
  const findings = files
    .flatMap(parseFile)
    .filter((raw) => !ignored.has(raw.name) && !ignored.has(raw.command))
    .map((raw) => classify(raw, config));
  const deduped = dedupe(findings).sort(compareFindings);
  return {
    root,
    generatedAt: new Date(0).toISOString(),
    findings: deduped,
    summary: summarize(deduped),
    recommendedPath: recommend(deduped, config.preferredSmokePath ?? []),
  };
}

function dedupe(findings: CommandFinding[]): CommandFinding[] {
  const byId = new Map<string, CommandFinding>();
  for (const finding of findings) {
    if (!byId.has(finding.id)) byId.set(finding.id, finding);
  }
  return [...byId.values()];
}

function compareFindings(a: CommandFinding, b: CommandFinding): number {
  return a.runner.localeCompare(b.runner) || a.name.localeCompare(b.name) || a.evidence.file.localeCompare(b.evidence.file);
}

function summarize(findings: CommandFinding[]): Record<Severity, number> {
  return findings.reduce<Record<Severity, number>>((acc, finding) => {
    acc[finding.severity] += 1;
    return acc;
  }, { safe: 0, caution: 0, risky: 0 });
}

function recommend(findings: CommandFinding[], preferred: string[]): CommandFinding[] {
  const safe = findings.filter((f) => f.severity === "safe");
  const picked: CommandFinding[] = [];
  for (const name of preferred) {
    const match = safe.find((f) => f.name === name || f.command === name);
    if (match && !picked.includes(match)) picked.push(match);
  }
  for (const kind of ["lint", "test", "build"] as const) {
    const match = safe.find((f) => f.kinds.includes(kind) && !picked.includes(f));
    if (match) picked.push(match);
  }
  return picked.slice(0, 4);
}
