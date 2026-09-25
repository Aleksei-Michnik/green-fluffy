---
name: i18n
description: How user-facing text works here — next-intl keys in four locale files (en, he RTL, ru, uk), key naming, plurals, RTL layout rules, email templates per locale, species common names. Use when adding or changing any string, message file, email template, or locale-sensitive formatting.
---

# i18n — four locales from day one

- Locales `en` (default), `he` (RTL), `ru`, `uk` — `packages/shared` `LOCALES`, web
  `src/i18n/routing.ts` (`localePrefix: 'never'`, cookie `NEXT_LOCALE`, `rtlLocales = ['he']`).
- Messages: `apps/web/messages/<locale>.json`, namespaced by surface (`auth.login.title`).
  A key exists in **all four files** or in none; CI will lint hardcoded strings once the rule
  lands (plan 0.3 step 5 — not yet implemented, `wiki/decisions.md`).
- Components: `useTranslations('namespace')` / `getTranslations` in server components; ICU
  plurals and selects for counts and gender; dates, numbers and units through `useFormatter` /
  the datetime helpers with the user's timezone — never string-built.
- Kit primitives read the `ui` namespace (`close`, `dismiss`, `loading`, `optional`, `required`,
  `skipToContent`, `tone.*`); everything else reaches a primitive through translated props. The
  `/kit` showcase is the one English-only surface (developer tool, not shipped).
- Tests render through `renderWithIntl` (`src/test/render.tsx`): real message files and a
  provider whose `onError` throws, so a missing or misspelled key fails the test; pass
  `{ locale: 'he' }` to assert a translation and RTL wiring.
- RTL: layout with logical properties (`ms-`, `me-`, `ps-`, `text-start`, `start-0`); icons that
  imply direction flip under `[dir=rtl]`; Latin names and numbers inside Hebrew text stay LTR
  (`<bdi>` or `unicode-bidi: isolate`).
- Length: Cyrillic ≈ 1.3× English, Hebrew shorter — no fixed-width labels.
- Emails: one template per locale keyed by `User.locale` (myfinpro's bilingual pattern extended).
- Species and knowledge-base notes carry `{ en, he, ru, uk }` objects; scientific name is the
  fallback when a locale name is missing.
- Definition of done for a UI iteration: strings present in all four files, reviewed by
  `i18n-translator`, `he` layout eyeballed (screenshot or Playwright RTL check).
