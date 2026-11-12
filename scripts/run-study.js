// Runs the whole suite N times with NO code changes and NO retries, saving one JSON report per run.
// Usage:  RUNS=30 WORKERS=4 node scripts/run-study.js
//         RUNS=30 WORKERS=1 LABEL=serial node scripts/run-study.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const runs = Number(process.env.RUNS || 30);
const workers = String(process.env.WORKERS || 4);
const label = process.env.LABEL || `workers-${workers}`;
const outDir = path.join('results', label);
fs.mkdirSync(outDir, { recursive: true });

const pad = (n) => String(n).padStart(3, '0');
const pwVersion = spawnSync('npx', ['playwright', '--version'], { shell: true, encoding: 'utf8' }).stdout.trim();

fs.writeFileSync(
  path.join(outDir, 'meta.json'),
  JSON.stringify({
    label, runs, workers,
    startedAt: new Date().toISOString(),
    node: process.version,
    playwright: pwVersion,
    platform: process.platform,
    retries: 0,
  }, null, 2),
);

for (let i = 1; i <= runs; i++) {
  const file = path.join(outDir, `run-${pad(i)}.json`);
  console.log(`[${label}] run ${i}/${runs}`);
  spawnSync('npx', ['playwright', 'test', '--reporter=json'], {
    shell: true,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, WORKERS: workers, RETRIES: '0', PLAYWRIGHT_JSON_OUTPUT_NAME: file },
  });
}
console.log(`Done. Reports are in ${outDir}. Next: npm run analyze`);
