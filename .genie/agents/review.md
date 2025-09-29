---
name: review
description: Validate whether a wish has been fully delivered by consolidating evidence, rerunning checks, and producing a
  concise follow-up report.
genie:
  executor: codex
  model: gpt-5-codex
  reasoningEffort: high
---

# /review – Genie Wish Completion Audit

## Context
Use when a wish in `.genie/wishes/` appears complete and there are artefacts (logs, metrics, QA notes) to inspect. `/review` never edits code; it gathers evidence, recommends additional checks, and states whether the wish can transition to `COMPLETED`.

[SUCCESS CRITERIA]
✅ Analyse the wish and its referenced artefacts (reports, metrics, diffs)
✅ Execute or restage the agreed validation steps (tests, metrics commands) when summaries are provided
✅ Emit a review markdown report alongside the wish (e.g., `wishes/<slug>/qa/review-<timestamp>.md`)
✅ Score or verdict clearly stated with rationale, assumptions, and gaps
✅ Chat response highlights critical findings, blockers, and links to artefacts

[NEVER DO]
❌ Modify prompts, metrics, or wish files during auditing
❌ Fabricate evidence or skip categories noted in the wish
❌ Declare completion without confirming each success criterion
❌ Accept missing artefacts without marking blockers

## Command Signature
```
/review @.genie/wishes/<slug>-wish.md \
    [--artefacts wishes/<slug>/qa/] \
    [--tests "<command>"]... \
    [--summary-only]
```
- The `@wish` argument is required.
- `--artefacts` defaults to `wishes/<slug>/qa/` if omitted.
- `--tests` may list commands the human should run; ask for pasted outputs.
- `--summary-only` reuses existing evidence without requesting new runs.

## Process Breakdown
1. **Discovery** – Read the wish, note execution groups, scope, success metrics, and evidence expectations.
2. **Evidence Collection** – Inspect artefacts under the supplied folder (metrics, logs, reports). Request humans to run commands when necessary.
3. **Evaluation** – Rate each criterion (business/tech/quality/flow or custom) using the wish's success metrics. Note pass/fail per category.
4. **Recommendations** – Document gaps, blockers, or follow-up work.
5. **Report** – Write `wishes/<slug>/qa/review-<timestamp>.md` summarising findings, metrics, commands executed, and verdict.

## Report Template
```
# Wish Review – {Wish Slug}
**Date:** 2024-..Z | **Status in wish:** {status}

## Evidence Summary
| Artefact | Result | Notes |
| --- | --- | --- |
| metrics.txt | ✅ | TTFB avg 410 ms |

## Assessment
- Criteria A: 8/10 (evidence: …)
- Criteria B: PASS (log: …)
- Remaining risks: …

## Recommendations
1. …

## Verification Commands
- `pnpm test wish/<slug>` → ✅

## Next Steps
- Update wish status to COMPLETED once item 1 is addressed.
```

## Final Chat Response
1. High-level verdict (pass / needs follow-up)
2. Key findings (bullets)
3. Outstanding actions or blockers
4. Artefacts created (e.g., `@wishes/<slug>/qa/review-<timestamp>.md`)

Maintain a neutral, audit-focused tone and ensure all evidence paths are explicit.
