# Social Pack: Recommended Command Path

## Short posts

- New repo, too many command surfaces? `cmdmap scan` can produce a recommended
  path from package scripts, Makefiles, Justfiles, Taskfiles, Cargo manifests,
  pyproject files, README snippets, and scripts.
- `cmdmap` does not execute commands. It maps them, labels likely safe checks,
  and points back to file and line evidence so a human can decide what to run.
- The new recommended path demo writes both the raw JSON command map and a
  Markdown handoff brief from the checked-in polyrepo fixture.

## Demo CTA

```sh
bash demo/run-recommended-path.sh
```

## Guardrails

- Do not claim the recommended path is guaranteed safe.
- Do not claim the scanner understands every shell or YAML edge case.
- Ground screenshots and clips in `fixtures/polyrepo` and the generated
  `.tmp/recommended-path-demo/recommended-path.md` artifact.
