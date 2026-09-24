---
name: privacy-guard
description: The non-negotiable access-control and privacy invariants of this app — roles and 404 policy, separate public DTOs, geo coarseness, documents always private, media serving rules, audit points — and how to register endpoints in the standing access-matrix suite. Use when designing or implementing any endpoint, public page, serializer, or media path.
---

# Privacy guard

Roles per subject (pet, group): `OWNER > CARETAKER > VIEWER > PUBLIC > NONE`, resolved by one
service (`PetAccessService`, generalized to `SubjectAccessService` in Phase 8). Guards take a
minimum role; the UI only reflects the result.

| Invariant                                                                                                                   | Where enforced                          |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Private subject to an unauthorized caller ⇒ **404** (never 403; no existence oracle)                                        | guard + list endpoints + error payloads |
| Public reads use a **separate DTO class** with no geo precision, documents, members, emails                                 | serializer path + snapshot tests        |
| Precise coordinates, polygons, addresses only to VIEWER+; public gets city/region/country resolved at save time             | location service, public DTOs           |
| Documents never public, even on public pets; viewers do not see them either                                                 | document endpoints, DTOs                |
| Media served only through the API with the same resolver; opaque keys; EXIF removed by re-encoding; magic-byte MIME; no SVG | media module                            |
| Per-section visibility applies only when the subject is public                                                              | resolver                                |
| Audit log on visibility, membership, location, document access, deletions, moderation                                       | services                                |
| Anonymous public endpoints throttled per IP; new accounts get reduced social limits                                         | throttle decorator                      |

## Register a new endpoint in the access matrix (from 4.2)

1. Add the route to the matrix fixture with expected outcomes for anon / non-member / viewer /
   caretaker / owner (status and, for reads, filtered payload).
2. The coverage assertion on route metadata fails CI for unregistered subject-scoped routes —
   that failure is the reminder, not a nuisance.
3. Public serializers get a snapshot test proving the forbidden fields are absent.
4. Geo-bearing surfaces get the 7.8 sweep (schema walk, SSR/OG/sitemap scan, log redaction).

Design docs: `docs/phase-4-design.md` (model, matrix), `docs/phase-7-design.md` (geo layers),
`docs/phase-3-design.md` (media), plan §4.4 and §5.
