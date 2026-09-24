---
paths:
  - 'infrastructure/**'
  - 'scripts/**'
  - '.github/**'
  - 'docker-compose*.yml'
  - '**/Dockerfile'
  - '**/*.Dockerfile'
---

Infrastructure files: read `wiki/infra-context.md` first (run `infra-sync` if older than 7 days).
Production deploys are dispatch-only; mail goes through the shared relay; the shared edge is
reloaded, never restarted; latest image tags verified online; actions pinned by SHA; secrets by
name only; no addresses, usernames or hostnames-as-configuration. Nothing here deploys or touches
a server — that is the owner's action. Agent: `devops`.
