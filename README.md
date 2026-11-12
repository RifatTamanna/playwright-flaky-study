# Playwright framework + flaky-test study

A Playwright (JavaScript) test framework for the public [Sauce Demo](https://www.saucedemo.com) shop, plus a small **measured study** of test flakiness: the same suite is run many times with no code changes and no retries, and the outcomes are analysed.

> Status: framework and tooling are complete. **Study results are not in this README yet.** See "Results" below. Do not trust any number here until it has been produced by `npm run study`.

## Why this repo exists
Test suites are often described as "stable" without evidence. This repo asks a measurable question: how often does the same test give different outcomes on identical runs, and does the way a test is written change that?

## Architecture
```
pages/        Page Objects (Login, Inventory, Cart, Checkout) - locators and actions only
fixtures.js   Playwright fixtures: injects page objects, and a `loggedIn` setup fixture
tests/        Stable suite: web-first assertions, data-test locators, no fixed sleeps
              brittle.spec.js: the same flows written in a brittle style (@brittle)
data/         Test data
scripts/      run-study.js (repeated runs) and analyze.py (summary + chart)
.github/      CI workflow
```
Design choices: locators live only in page objects; tests read as behaviour; retries are off by default (`RETRIES=0`) so flakiness is not hidden.

## Run it
```bash
npm install
npx playwright install chromium
npm test                 # all tests
npm run test:stable      # stable suite only (this is the CI gate)
npm run test:brittle     # brittle comparison suite only
```

## CI
GitHub Actions (`.github/workflows/playwright.yml`) runs the stable suite on every push and pull request and uploads the HTML report. The workflow can also be started manually with a number of runs to execute the study in CI.

## The study
**Research questions**
1. How many tests give inconsistent outcomes across identical runs?
2. Does a brittle writing style (fixed sleeps, CSS paths, one-shot reads) fail more often than a stable style on the same flows?
3. Does the number of parallel workers change the failure rate?
4. Do slow conditions (CPU/network throttling) change the answers to 1 and 2?

**Definition.** A test is *flaky* if, across N identical runs (same code, same site, retries off), it passed at least once and failed at least once.

**Method**
```bash
RUNS=30 WORKERS=1 LABEL=workers-1 npm run study
RUNS=30 WORKERS=4 LABEL=workers-4 npm run study
npm run analyze
```
**Throttled condition (added after the baseline showed no failures).** A fast machine and a fast demo site hide timing problems, so the study can also run under slow conditions using environment variables (Chromium only):
```
THROTTLE_CPU=4            CPU 4x slower
THROTTLE_LATENCY_MS=200   200 ms added latency per request
THROTTLE_KBPS=1600        bandwidth cap in kilobits/s (optional)
```
Windows `cmd` example:
```
set RUNS=30&& set WORKERS=4&& set LABEL=throttled-cpu4-lat200&& set THROTTLE_CPU=4&& set THROTTLE_LATENCY_MS=200&& npm run study
```
Each setting is stored in `results/<label>/meta.json`, and each label shows up as its own row in the summary.

Outputs in `results/`: `summary_per_test.csv`, `summary_per_group.csv`, `failure_categories.csv`, `summary.md`, `failure_rate_per_test.png`, and `meta.json` per setting (Node, Playwright version, platform).

## Results

Each setting was run 30 times on identical code with retries disabled. Each run executes 12 tests (9 stable, 3 brittle), so every setting has 360 test executions (270 stable + 90 brittle).

| Setting | Workers | Throttling | Executions | Failures | Tests with inconsistent outcomes |
|---|---|---|---|---|---|
| `workers-1` | 1 | none | 360 | 0 | 0 |
| `workers-4` | 4 | none | 360 | 2 | 2 |
| `throttled-cpu4-lat200` | 4 | CPU 4x slower, +200 ms latency | 360 | 0 | 0 |

**What happened**
- `workers-4` produced two failures, both 30-second timeouts, in different runs and different tests: one stable test (run 17, the checkout test timed out while logging in during setup) and one brittle test (run 19, the complete-purchase test).
- `workers-1` and the throttled setting produced no failures.
- With 0 failures in 360 executions, the true failure rate in those settings is probably below about 0.8% (rule of three).

**What can and cannot be concluded**
- The data does **not** show that running 4 workers in parallel causes failures, nor that the brittle style fails more often than the stable style. Two failures in total are too few, they occurred in different tests and runs, and the throttled setting also used 4 workers and had none.
- The throttled result does **not** show that the suite is robust under slow conditions. I did not independently verify that the throttling took effect, and the mean test duration in that run was not higher than in the `workers-4` run (stable 2.67 s vs 3.71 s, brittle 4.85 s vs 6.73 s). Without that verification, the throttled run cannot be interpreted.
- Network or external-site problems are a plausible explanation for the two timeouts, because the tests run against a public demo site. I did not test this explanation.

**What would be needed for a firmer answer:** more runs per setting, a locally hosted application to remove network variance, an explicit check that throttling slows the page, and trace files for failed tests.

## Threats to validity (keep and update these)
- All runs were made on one personal Windows PC against a public demo site, at a time of day I did not control for.
- Throttling was implemented through the Chrome DevTools Protocol and its effect was not independently verified.
- The brittle suite has only 3 tests, and the stable suite 9, so per-test conclusions are weak.
