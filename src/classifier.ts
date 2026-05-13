import type { CmdMapConfig, CommandFinding, CommandKind, Confidence, Evidence, Severity } from "./types.js";

interface RawCommand {
  name: string;
  command: string;
  runner: string;
  evidence: Evidence;
}

const KIND_PATTERNS: Array<[CommandKind, RegExp, Confidence]> = [
  ["test", /(^|[:\s-])(test|spec|vitest|jest|mocha|pytest|cargo test)(\b|$)/i, "high"],
  ["build", /(^|[:\s-])(build|compile|tsc|cargo build)(\b|$)/i, "high"],
  ["lint", /(^|[:\s-])(lint|eslint|ruff|clippy|fmt|format)(\b|$)/i, "high"],
  ["dev-server", /(^|[:\s-])(dev|serve|server|start|watch)(\b|$)/i, "medium"],
  ["release", /(release|version|changelog|changeset)/i, "high"],
  ["publish", /(publish|npm publish|cargo publish|twine upload|docker push)/i, "high"],
  ["destructive", /(rm\s+-rf|rimraf|delete|destroy|drop\s+database|reset\s+--hard|clean)/i, "high"],
  ["networked", /(curl|wget|ssh|scp|rsync|git\s+push|docker\s+pull|docker\s+push|http:\/\/|https:\/\/)/i, "medium"],
  ["privileged", /(^|[;&|\s])(sudo|su\s+-|chmod|chown|launchctl|systemctl)(\b|\s)/i, "high"],
  ["secrets", /(secret|token|password|apikey|api_key|\.env)/i, "medium"],
];

export function classify(raw: RawCommand, config: CmdMapConfig = {}): CommandFinding {
  const haystack = `${raw.name} ${raw.command}`;
  const configuredKinds = config.labels?.[raw.name] ?? [];
  const matched = KIND_PATTERNS.filter(([, pattern]) => pattern.test(haystack));
  const kinds = [...new Set<CommandKind>([...configuredKinds, ...matched.map(([kind]) => kind)])];
  const confidence = highestConfidence(matched.map(([, , confidence]) => confidence));
  const effectiveKinds = kinds.length ? kinds : ["unknown" as CommandKind];
  const allow = new Set(config.allowRisky ?? []);
  let severity: Severity = "safe";
  const riskyKinds = effectiveKinds.filter((kind) => ["release", "publish", "destructive", "secrets", "networked", "privileged"].includes(kind));
  if (riskyKinds.length && !allow.has(raw.name) && !allow.has(raw.command)) severity = "risky";
  else if (effectiveKinds.includes("dev-server") || effectiveKinds.includes("unknown")) severity = "caution";
  const safetyNotes = notesFor(effectiveKinds, severity);
  return {
    id: stableId(raw.runner, raw.name),
    name: raw.name,
    command: raw.command,
    runner: raw.runner,
    kinds: effectiveKinds,
    severity,
    confidence,
    evidence: raw.evidence,
    safetyNotes,
    remediation: severity === "risky" ? "Review before running; add to allowRisky only after maintainer confirmation." : undefined,
  };
}

export function explainCommand(command: string, config: CmdMapConfig = {}): CommandFinding {
  return classify({ name: command, command, runner: "ad-hoc", evidence: { file: "<input>", line: 1, source: command } }, config);
}

function stableId(runner: string, name: string): string {
  return `${runner}:${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function highestConfidence(values: Confidence[]): Confidence {
  if (values.includes("high")) return "high";
  if (values.includes("medium")) return "medium";
  return "low";
}

function notesFor(kinds: CommandKind[], severity: Severity): string[] {
  const notes = new Set<string>();
  if (kinds.includes("test")) notes.add("Verification-oriented command; usually a good first smoke.");
  if (kinds.includes("build")) notes.add("Build command; useful after dependency or compile changes.");
  if (kinds.includes("lint")) notes.add("Static check command; low side-effect expectation.");
  if (kinds.includes("dev-server")) notes.add("May start a long-running local process.");
  if (kinds.includes("release") || kinds.includes("publish")) notes.add("Release/publish wording detected; do not run casually.");
  if (kinds.includes("destructive")) notes.add("Destructive wording or shell pattern detected.");
  if (kinds.includes("networked")) notes.add("Network-looking behavior detected.");
  if (kinds.includes("privileged")) notes.add("Privileged local system command detected; require explicit review before running.");
  if (kinds.includes("secrets")) notes.add("Secret/token/env handling detected.");
  if (severity === "caution") notes.add("Inspect before automation because intent is not fully clear.");
  return [...notes];
}
