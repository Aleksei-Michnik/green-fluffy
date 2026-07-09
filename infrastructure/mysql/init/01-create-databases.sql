-- ─────────────────────────────────────────────────────────────
-- LOCAL DEV ONLY. Runs once on first container start (empty data dir).
-- Grants the app user broad privileges so Prisma `migrate dev` can
-- create/drop its temporary shadow database. Production uses a
-- tightly-scoped user + `migrate deploy` (no shadow DB needed).
-- ─────────────────────────────────────────────────────────────

-- Integration-test database (mirrors the main schema during CI/local tests)
CREATE DATABASE IF NOT EXISTS green_fluffy_test;

-- Broad grant for the local dev user (shadow DB support). NEVER in prod.
GRANT ALL PRIVILEGES ON *.* TO 'green_fluffy_user'@'%';
FLUSH PRIVILEGES;
