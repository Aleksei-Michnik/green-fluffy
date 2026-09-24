---
name: kb-dataset
description: Format and curation rules for packages/species-data — species entries, hazard, companion, care and procedure rules, slugs, sources, locale completeness, validation and seeding. Use when adding or editing any dataset file or its schema.
---

# Knowledge-base dataset (`packages/species-data`)

Shapes are specified in `docs/phase-2-design.md` ("Species Seed Dataset") and
`docs/phase-9-design.md` ("Dataset Design"); this skill is the checklist.

- **Files**: `data/animals/*.json`, `data/plants/*.json` (species trees), `data/hazards/`,
  `data/companions/`, `data/care/`, `data/procedures/`; `src/schema.ts` (Zod), `src/validate.ts`
  (CI), `src/index.ts` (loader). Every file has `_sources`.
- **Slug** = stable key (`felis-catus`, `maine-coon`, `monstera-deliciosa`): kebab-case
  scientific or established name; never renamed, only aliased; rules reference slugs;
  `subjectMatch: exact | descendants`.
- **Names**: `commonNames: { en: [], he: [], ru: [], uk: [] }` — all four present (CI fails
  otherwise); scientific name separate.
- **Rules**: hazards (`toxic_ingestion | toxic_contact | water_toxic | thorn_injury | allergen`,
  severity `info | caution | danger | critical`, `targets` of slugs or macros `@cats @dogs @fish
@ANIMAL`), companions (`relation good|bad`, `context` list), care guidelines (`topic`,
  `placement`, `season`, `advice`, machine-readable `cadence` band), procedure rules (`kind`,
  `appliesTo`, `necessity`, `window`). Every rule: `sources: [{ name, url }]` ≥ 1 and notes ×4.
- **Validation**: `pnpm --filter @green-fluffy/species-data validate` (define it in the package)
  must pass locally and in CI; slugs must resolve; macros must expand to ≥ 1 target.
- **Seeding / kb-sync**: upsert by slug or natural key, stamp `datasetVersion`, prune rows of
  removed rules; run twice ⇒ no diff.
- **Curation**: public, citable sources only; prefer fewer well-sourced rules over many
  unsourced ones; contribution flow documented in `docs/kb-contributing.md` (9.6).
