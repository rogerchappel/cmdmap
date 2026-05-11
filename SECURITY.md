# Security

`cmdmap` is local-first and does not intentionally send project data anywhere.

## Supported version

Security fixes target the current `main` branch until a stable release stream exists.

## Reporting

Please open a private security advisory on GitHub if available, or contact the maintainer without including sensitive repo contents in public issues.

## Design expectations

- Scanning must not execute discovered commands.
- Output should not include environment variable values or secret contents.
- Network behavior should be absent except user-initiated package/GitHub workflows outside the CLI.
- Risky release, publish, destructive, network, and secret-related commands should remain conservative by default.
