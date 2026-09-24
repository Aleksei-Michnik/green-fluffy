# Wiki — deep knowledge, loaded on demand

`AGENTS.md` is the index; `docs/` holds the design documents (what to build); this directory holds
_operational_ knowledge (how we build it here) that is too deep for the index and too broad for
one agent. Read a page only when its topic is in play. Every fact carries the date it was checked.

| Page                                           | Read when                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| [architecture-map.md](architecture-map.md)     | Orienting in the monorepo, the module map per phase, cross-cutting rules   |
| [conventions.md](conventions.md)               | Writing any code: naming, layout, DTOs, DRY/no-legacy, formatting          |
| [ui-design-system.md](ui-design-system.md)     | Designing or building any page or component                                |
| [testing.md](testing.md)                       | Writing or running tests, coverage gates, standing suites                  |
| [myfinpro-reuse-map.md](myfinpro-reuse-map.md) | Porting anything from the sister repo                                      |
| [infra-context.md](infra-context.md)           | Touching compose, Dockerfiles, CI/CD, nginx, Mdock; anything deploy-shaped |
| [decisions.md](decisions.md)                   | Before re-deciding something (stack, ports, patterns)                      |
| [gotchas.md](gotchas.md)                       | A command fails in a surprising way; environment quirks                    |
| [learnings.md](learnings.md)                   | Append-only log written by the `learn` skill; skim for recent changes      |

Rules for editing: verified facts only, dated; no secrets, IPs, usernames or hostnames-as-config
(public repository); keep a page under ~200 lines — split and index instead of growing.
