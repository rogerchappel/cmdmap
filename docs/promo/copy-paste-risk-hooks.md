# Copy/paste risk hooks

These hooks are grounded in `cmdmap explain` and the checked-in polyrepo
fixture. Avoid presenting the risk labels as a security audit.

## Short posts

1. Before running a command from a README or issue, ask `cmdmap explain`. It
   labels publish, release, and curl-to-shell shapes as risky without executing
   anything.
2. `cmdmap` is useful before the repo scan too: paste a single command into
   `cmdmap explain`, then scan the repo for safer test/build alternatives.
3. Demo idea: compare `npm run release` with `fixtures/polyrepo` scan output and
   show how command evidence points to a safer smoke path.

## Recording command

```sh
bash demo/run-copy-paste-risk-review.sh
```
