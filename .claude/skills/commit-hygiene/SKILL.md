---
name: commit-hygiene
description: Rules for anything that ends up in git in this public repository — what may never be committed, commit message format, prettier pre-check, git identity, branches. Use before staging, committing, writing a PR description, or when asked whether something is safe to commit.
---

# Commit hygiene (public repository)

**Never in files or messages**: secrets, tokens, keys, passwords, server addresses, usernames,
server names, or production hostnames used as configuration. `.env`, `.env.*` (except
`*.example` / `*.template`), `*.pem`, `*.key`, `uploads/`, `media-dev/*` are gitignored — keep
them so. Placeholders only in examples. Gitleaks runs in CI; do not rely on it.

**Before committing**

1. `pnpm format` on changed files (CI runs `format:check`, markdown included) and
   `pnpm lint && pnpm typecheck`; tests for the touched packages.
2. `git diff --cached | grep -niE 'password=|secret=|token=|BEGIN (RSA|OPENSSH)|[0-9]{1,3}(\.[0-9]{1,3}){3}'`
   returns nothing you did not intend.
3. `git config user.email` is the identity this repo already uses (`git log -1 --format=%ae`);
   the workstation's global identity belongs to another organisation.

**Message**: Conventional Commits, lowercase subject (PR-title check enforces it), optional
iteration suffix `(N.m)`; body explains why and what was verified; end with the co-author
trailer this repo's history uses (`Co-Authored-By: Claude … <noreply@anthropic.com>`). One
logical change per commit; no `--amend` except trivial fixups; no domains in messages.

**Branches**: `main` is the default and CI target today; feature/phase work on `phase/<N>` or
`feat/<topic>`; `develop` → staging arrives with 0.7. Never push, deploy or merge to `main`
unless the user asks in this session.
