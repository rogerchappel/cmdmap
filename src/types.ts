export type CommandKind =
  | "test"
  | "build"
  | "lint"
  | "dev-server"
  | "release"
  | "publish"
  | "destructive"
  | "networked"
  | "privileged"
  | "secrets"
  | "unknown";

export type Severity = "safe" | "caution" | "risky";
export type Confidence = "low" | "medium" | "high";

export interface Evidence {
  file: string;
  line: number;
  source: string;
}

export interface CommandFinding {
  id: string;
  name: string;
  command: string;
  runner: string;
  kinds: CommandKind[];
  severity: Severity;
  confidence: Confidence;
  evidence: Evidence;
  safetyNotes: string[];
  remediation?: string;
}

export interface CmdMapConfig {
  allowRisky?: string[];
  ignore?: string[];
  labels?: Record<string, CommandKind[]>;
  preferredSmokePath?: string[];
}

export interface ScanOptions {
  cwd: string;
  configPath?: string;
}

export interface ScanResult {
  root: string;
  generatedAt: string;
  findings: CommandFinding[];
  summary: Record<Severity, number>;
  recommendedPath: CommandFinding[];
}
