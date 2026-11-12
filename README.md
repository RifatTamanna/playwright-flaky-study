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

**Definition.** A test is *flaky* if, across N identical runs (same code, same site, retries off), it passed at least once and failed at least once.

**Method**
```bash
RUNS=30 WORKERS=1 LABEL=workers-1 npm run study
RUNS=30 WORKERS=4 LABEL=workers-4 npm run study
npm run analyze
```
Outputs in `results/`: `summary_per_test.csv`, `summary_per_group.csv`, `failure_categories.csv`, `summary.md`, `failure_rate_per_test.png`, and `meta.json` per setting (Node, Playwright version, platform).

## Results
_Not run yet._ After running the study, paste `results/summary.md` and the chart here, then write 3-5 sentences answering RQ1-RQ3 in your own words.

## Threats to validity (keep and update these)
- One demo site, one browser (Chromium), a small number of tests: results may not generalise.
- A public demo site can change or be slow at different times of day; record when you ran the study.
- Home vs CI network and CPU differ. State where each run was made.
- The failure categories in `analyze.py` are a keyword heuristic, not manual classification.
- If no flakiness is found, that is still a valid result. Possible extensions: CPU or network throttling, more runs, more browsers, a larger app.
