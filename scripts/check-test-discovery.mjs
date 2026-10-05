import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['test'], { encoding: 'utf8' });
const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
if (result.status !== 0) {
  process.stderr.write(output);
  process.exit(result.status ?? 1);
}

const summary = output.match(/ℹ tests (\d+)/);
if (!summary || Number(summary[1]) === 0) {
  process.stderr.write(output);
  console.error('npm test completed without discovering any tests.');
  process.exit(1);
}
console.log(`npm test discovered ${summary[1]} tests.`);
