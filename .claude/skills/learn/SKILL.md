---
name: learn
description: Harvests what this conversation taught (user corrections, confirmed approaches, verified facts, failed commands and their fixes, decisions) and updates the agents, skills, wiki pages or AGENTS.md index that should carry the lesson. Use at the end of a work session or orchestrated run, after a correction from the user, or when asked to "remember this for the project".
argument-hint: '[focus topic, or agent|skill|wiki|index]'
---

# learn — make the next session smarter

Runs **inline** (it needs the conversation). Focus: `$ARGUMENTS` (default: everything).

## 1. Harvest candidates

Scan the conversation and tool output for:

- **Corrections** — the user said "no", "not like that", "always/never …", or re-asked.
- **Confirmed approaches** — something worked and the user accepted it.
- **Verified facts** — versions, commands, paths, behaviours proven by output (not by memory).
- **Failures and fixes** — a command or test failed; what resolved it.
- **Decisions** — a choice made that later work must respect.

Discard: one-off details, anything derivable from the code or git history, anything already
recorded (grep the target first), and anything sensitive (secrets, addresses, usernames,
hostnames-as-configuration — this repository is public).

## 2. Route each finding

| Kind                                   | Target                                             |
| -------------------------------------- | -------------------------------------------------- |
| Who should do it / when to delegate    | `.claude/agents/<name>.md` (description or body)   |
| How to do a recurring task             | `.claude/skills/<name>/SKILL.md`                   |
| Deep fact, environment quirk, decision | `wiki/gotchas.md`, `wiki/decisions.md`, topic page |
| Index-level rule everyone needs        | `AGENTS.md` (rare; keep it under 150 lines)        |
| Preference about how the user works    | Claude's memory directory (not the repo)           |

## 3. Apply

- Edit in place; prefer replacing a stale line over appending a new one.
- Respect size budgets: agent ≤ 60 lines, SKILL.md ≤ 70, wiki page ≤ 200, AGENTS.md ≤ 150.
  If a target would exceed its budget, split into a wiki page and link it.
- Descriptions must still say **when** to call (action + situation); keep them 1–3 sentences.
- Date every fact. Fix or delete facts the finding proves wrong — never leave both.
- Append one row per finding to `wiki/learnings.md` (date, finding, evidence, applied to).
- `npx prettier --write` on every touched markdown file (CI checks markdown formatting).

## 4. Report

A table: finding → target file → change (added / replaced / removed). Then anything you chose
not to record and why. If nothing qualified, say so in one line.
