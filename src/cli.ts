#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { explainCommand } from "./classifier.js";
import { loadConfig } from "./config.js";
import { toJson, toMarkdown } from "./reporters.js";
import { scan } from "./scan.js";
import type { Severity } from "./types.js";

interface Args { _: string[]; [key: string]: string | boolean | string[]; }
const formats = ["markdown", "json"] as const;
const failThresholds = ["risky", "risky-release", "caution"] as const;
const valueOptions = new Set(["format", "out", "fail-on", "config"]);

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  validateArgs(args, command);
  if (args.version || args.v) return version();
  if (!command || args.help || args.h) return help();
  if (command === "scan") return scanCommand(args);
  if (command === "explain") return explain(args);
  if (command === "rules") return rules();
  throw new Error(`Unknown command: ${command}`);
}

async function scanCommand(args: Args): Promise<void> {
  const target = args._[1] ?? ".";
  const result = await scan({ cwd: target, configPath: stringOpt(args.config) });
  const format = stringOpt(args.format) ?? (args.out && `${args.out}`.endsWith(".json") ? "json" : "markdown");
  const output = format === "json" ? toJson(result) : toMarkdown(result);
  const out = stringOpt(args.out);
  if (out) {
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, output);
  } else {
    process.stdout.write(output);
  }
  const failOn = stringOpt(args["fail-on"]);
  if (failOn && shouldFail(result.summary, failOn)) process.exitCode = 2;
}

async function explain(args: Args): Promise<void> {
  const input = args._.slice(1).join(" ");
  if (!input) throw new Error("Usage: cmdmap explain <command>");
  const config = await loadConfig(process.cwd(), stringOpt(args.config));
  const finding = explainCommand(input, config);
  process.stdout.write(toMarkdown({ root: process.cwd(), generatedAt: new Date(0).toISOString(), findings: [finding], summary: { safe: finding.severity === "safe" ? 1 : 0, caution: finding.severity === "caution" ? 1 : 0, risky: finding.severity === "risky" ? 1 : 0 }, recommendedPath: finding.severity === "safe" ? [finding] : [] }));
}

function rules(): void {
  process.stdout.write(`cmdmap safety rules\n\n- release/publish/network/secrets/destructive patterns are risky by default\n- test/build/lint commands are safe verification candidates\n- dev servers and unknown commands are caution\n- allowRisky in config can downgrade known local commands\n`);
}

function shouldFail(summary: Record<Severity, number>, failOn: string): boolean {
  if (failOn === "risky" || failOn === "risky-release") return summary.risky > 0;
  if (failOn === "caution") return summary.risky + summary.caution > 0;
  return false;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const [key, inline] = token.slice(2).split("=", 2);
      if (inline !== undefined) args[key] = inline;
      else if (valueOptions.has(key) && argv[i + 1] && !argv[i + 1].startsWith("-")) args[key] = argv[++i];
      else args[key] = true;
    } else if (token.startsWith("-") && token.length === 2) {
      args[token.slice(1)] = true;
    } else args._.push(token);
  }
  return args;
}

function validateArgs(args: Args, command: string | undefined): void {
  const knownCommands = ["scan", "explain", "rules"];
  if (command && !knownCommands.includes(command)) usageError(`Unknown command: ${command}`);

  const allowed = new Set(command === "scan"
    ? ["_", "format", "out", "fail-on", "config", "help", "h"]
    : command === "explain"
      ? ["_", "config", "help", "h"]
      : command === "rules"
        ? ["_", "help", "h"]
        : ["_", "help", "h", "version", "v"]);
  for (const key of Object.keys(args)) {
    if (!allowed.has(key)) usageError(`Unknown option: ${key.length === 1 ? "-" : "--"}${key}`);
  }

  for (const option of valueOptions) {
    if (args[option] === true) usageError(`--${option} requires a value`);
  }
  const format = stringOpt(args.format);
  if (format && !formats.includes(format as typeof formats[number])) {
    usageError(`Invalid --format value: ${format} (expected ${formats.join(" or ")})`);
  }
  const failOn = stringOpt(args["fail-on"]);
  if (failOn && !failThresholds.includes(failOn as typeof failThresholds[number])) {
    usageError(`Invalid --fail-on value: ${failOn} (expected ${failThresholds.join(", ")})`);
  }
  if (command === "scan" && args._.length > 2) usageError("scan accepts at most one path");
  if (command === "rules" && args._.length > 1) usageError("rules accepts no arguments");
}

function usageError(message: string): never {
  throw new UsageError(message);
}

class UsageError extends Error {}

function stringOpt(value: unknown): string | undefined { return typeof value === "string" ? value : undefined; }
function usage(): string { return `cmdmap - map repo commands safely\n\nUsage:\n  cmdmap scan <path> [--format markdown|json] [--out file] [--fail-on risky|risky-release|caution] [--config file]\n  cmdmap explain <command> [--config file]\n  cmdmap rules\n`; }
function help(): void { process.stdout.write(usage()); }
async function version(): Promise<void> {
  const pkg = JSON.parse(await fs.readFile(new URL("../../package.json", import.meta.url), "utf8")) as { version?: string };
  process.stdout.write(`${pkg.version ?? "0.0.0"}\n`);
}

main().catch((error: Error) => {
  process.stderr.write(`cmdmap: ${error.message}\n`);
  if (error instanceof UsageError) process.stderr.write(`\n${usage()}`);
  process.exitCode = 1;
});
