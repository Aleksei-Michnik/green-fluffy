---
name: progress-log
description: How to record a finished iteration — the phase progress file, the docs/progress.md index, and design-doc corrections — in the format the orchestrator and the next session read as ground truth. Use when an iteration is done, or when asked what is done.
---

# Progress log

Layout (mirrors myfinpro's docs rules):

- `docs/progress.md` — **index only**: phase table (phase, status, iterations done/total, link),
  2–4 sentence summary per phase, `Last updated` and `Current work` lines. No iteration detail.
- `docs/phase-<N>-progress.md` — one per phase. Heading 1 `# Phase <N> — <Name>` once; heading 2
  per iteration `## <N.m> — <Title> (<YYYY-MM-DD>)`; heading 3 for `### Scope`, `### API`,
  `### Web`, `### Tests`, `### Decisions` when a section grows. Never deeper than heading 4.
- Per iteration record: commit hashes (and CI run ids once CD exists), what shipped, decisions
  made, test counts, blockers as `BLOCKED: <what the owner must do>`.
- Design docs stay separate (`docs/phase-<N>-design.md`); when reality diverged, amend the
  design doc in the same change and say so in the progress entry.

## When an iteration is finished

1. Append the heading-2 section to `docs/phase-<N>-progress.md` (create the file with its
   heading 1 on the phase's first iteration).
2. Update the phase row and summary in `docs/progress.md` plus `Last updated` / `Current work`.
3. Move any lasting lesson to the wiki (`learn` skill); the progress file is a journal, not a
   knowledge base.
4. `npx prettier --write docs/progress.md docs/phase-<N>-progress.md`.
