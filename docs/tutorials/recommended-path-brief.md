# Recommended Path Brief

`cmdmap` can turn a mixed command surface into a short recommended path for the
first verification commands to consider.

## Run it

```sh
bash demo/run-recommended-path.sh
```

The script scans `fixtures/polyrepo`, writes the full JSON command map, and
generates `.tmp/recommended-path-demo/recommended-path.md` from the
`recommendedPath` field.

## What the brief includes

- The command string.
- The safety severity assigned by `cmdmap`.
- The runner that produced the command.
- The source file and line evidence.
- The safety note that explains why the command appears in the path.

## Review guidance

Use the brief as a starting point for a human or agent handoff. It does not run
the listed commands, and it should not override repository-specific maintainer
instructions.
