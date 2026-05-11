#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { explainCommand } from "./classifier.js";
import { loadConfig } from "./config.js";
import { toJson, toMarkdown } from "./reporters.js";
import { scan } from "./scan.js";
import type { Severity } from "./types.js";

interface Args { _: string[]; [key: string]: string | boolean | string[]; }

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
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
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) args[key] = argv[++i];
      else args[key] = true;
    } else if (token.startsWith("-") && token.length === 2) {
      args[token.slice(1)] = true;
    } else args._.push(token);
  }
  return args;
}

function stringOpt(value: unknown): string | undefined { return typeof value === "string" ? value : undefined; }
function help(): void { process.stdout.write(`cmdmap - map repo commands safely\n\nUsage:\n  cmdmap scan <path> [--format markdown|json] [--out file] [--fail-on risky]\n  cmdmap explain <command>\n  cmdmap rules\n`); }

main().catch((error: Error) => { console.error(`cmdmap: ${error.message}`); process.exitCode = 1; });
