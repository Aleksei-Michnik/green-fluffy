---
paths:
  - 'apps/web/**'
---

Web code: no hardcoded user-facing strings — next-intl keys present in all four `messages/*.json`
files (the `/kit` showcase is the documented exception); compose from `components/ui` with the
semantic tokens, `cn()`, `focus-ring` and `Field` (`ui-kit` skill for a missing primitive or
variant); logical CSS properties (RTL); both themes; `renderWithIntl` + `expectNoA11yViolations`
in specs; a new page or component needs a spec in `docs/ui/` (`ui-designer`). Skills:
`ui-conventions`, `ui-kit`, `i18n`, `testing`.
