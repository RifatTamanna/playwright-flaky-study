"""Summarise the study: reads results/<label>/run-*.json and writes CSVs, a Markdown table and a chart.

A test is called FLAKY here if, across identical runs (same code, same site, retries off),
it both passed at least once and failed at least once.
"""
import glob
import json
import os
import re

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

RESULTS = "results"
ANSI = re.compile(r"\x1b\[[0-9;]*m")


def category(msg: str) -> str:
    """Heuristic only: a rough bucket for the first error line."""
    m = msg.lower()
    if "strict mode violation" in m:
        return "ambiguous locator"
    if "timeout" in m and "waiting for" in m:
        return "timeout waiting for element"
    if "timeout" in m:
        return "timeout (other)"
    if "expect(" in m or "expected" in m:
        return "assertion mismatch"
    return "other"


def walk(suite, path, rows, label, run_id):
    for spec in suite.get("specs", []):
        name = " > ".join(path + [spec["title"]])
        for t in spec.get("tests", []):
            results = t.get("results", [])
            if not results:
                continue
            final = results[-1]
            status = final.get("status")
            if status == "skipped":
                continue
            msg = ANSI.sub("", (final.get("error") or {}).get("message", "")).strip().split("\n")[0]
            rows.append({
                "label": label,
                "run": run_id,
                "test": name,
                "group": "brittle" if "@brittle" in name else "stable",
                "failed": status in ("failed", "timedOut"),
                "duration_ms": final.get("duration", 0),
                "error": msg,
            })
    for s in suite.get("suites", []):
        walk(s, path + [s["title"]], rows, label, run_id)


rows = []
for folder in sorted(glob.glob(os.path.join(RESULTS, "*"))):
    if not os.path.isdir(folder):
        continue
    label = os.path.basename(folder)
    for f in sorted(glob.glob(os.path.join(folder, "run-*.json"))):
        run_id = os.path.splitext(os.path.basename(f))[0]
        with open(f, encoding="utf-8") as fh:
            try:
                report = json.load(fh)
            except json.JSONDecodeError:
                print(f"Skipping unreadable report: {f}")
                continue
        for s in report.get("suites", []):
            walk(s, [s["title"]], rows, label, run_id)

if not rows:
    raise SystemExit("No run-*.json files found. Run `npm run study` first.")

df = pd.DataFrame(rows)

per_test = (
    df.groupby(["label", "group", "test"])
    .agg(runs=("failed", "size"), failures=("failed", "sum"))
    .reset_index()
)
per_test["failure_rate"] = (per_test["failures"] / per_test["runs"]).round(3)
per_test["flaky"] = (per_test["failures"] > 0) & (per_test["failures"] < per_test["runs"])
per_test.to_csv(os.path.join(RESULTS, "summary_per_test.csv"), index=False)

per_group = (
    per_test.groupby(["label", "group"])
    .agg(tests=("test", "nunique"), executions=("runs", "sum"),
         failures=("failures", "sum"), flaky_tests=("flaky", "sum"))
    .reset_index()
)
per_group["failure_rate_%"] = (100 * per_group["failures"] / per_group["executions"]).round(2)
# Mean test duration per label/group: a sanity check that throttling really slowed things down.
dur = (df.groupby(["label", "group"])["duration_ms"].mean() / 1000).round(2).rename("mean_duration_s").reset_index()
per_group = per_group.merge(dur, on=["label", "group"])
per_group.to_csv(os.path.join(RESULTS, "summary_per_group.csv"), index=False)

fails = df[df["failed"]].copy()
if not fails.empty:
    fails["category"] = fails["error"].map(category)
    cats = fails.groupby(["label", "group", "category"]).size().reset_index(name="count")
else:
    cats = pd.DataFrame(columns=["label", "group", "category", "count"])
cats.to_csv(os.path.join(RESULTS, "failure_categories.csv"), index=False)
if not fails.empty:
    fails[["label", "group", "run", "test", "error"]].to_csv(
        os.path.join(RESULTS, "failures_detail.csv"), index=False)

with open(os.path.join(RESULTS, "summary.md"), "w", encoding="utf-8") as fh:
    fh.write("### Failure rate by suite style and worker setting\n\n")
    fh.write(per_group.to_markdown(index=False))
    fh.write("\n\n### Failure categories (heuristic)\n\n")
    fh.write(cats.to_markdown(index=False) if not cats.empty else "No failures recorded.")
    fh.write("\n")

pivot = per_test.pivot_table(index="test", columns="label", values="failure_rate", fill_value=0)
ax = pivot.plot(kind="barh", figsize=(10, max(4, 0.4 * len(pivot))))
ax.set_xlabel("Failure rate across identical runs")
ax.set_ylabel("")
ax.set_xlim(0, 1)
plt.tight_layout()
plt.savefig(os.path.join(RESULTS, "failure_rate_per_test.png"), dpi=150)

print(per_group.to_string(index=False))
print("Wrote CSVs, summary.md and failure_rate_per_test.png to results/")
