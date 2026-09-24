# UI design system (checked 2026-09-24)

Owned by the `ui-designer` agent; consumed by `web-coder`. Extend it here before building a new
surface — a component or page without a spec in this page is not ready to code.

## Brand and tokens (as implemented in `apps/web/src/app/globals.css`)

- Palette: Tailwind 4 `@theme` with `--color-primary-{50…950}` = emerald (`#10b981` at 500).
  "Green and fluffy": nature-green primary; neutrals from slate. Secondary/accent tokens (warm
  "fluffy" accent for animals, semantic success/warning/danger for warnings severity
  `info | caution | danger | critical`) are **not defined yet** — define them here first, then in
  `@theme`.
- Typography: Inter via `--font-sans`; system fallbacks. Hebrew/Cyrillic glyph coverage must be
  verified when the font is self-hosted (Inter covers Cyrillic; Hebrew falls to system fonts).
- Theme: `<html data-theme="light|dark">` set pre-hydration; dark variant is a custom Tailwind
  variant `dark`. `color-scheme` set per theme. Body uses a light→grey / slate→black gradient.
- RTL: `dir` comes from the locale (`he`); use CSS **logical properties** (`ms-`, `me-`, `ps-`,
  `text-start`) — never `ml/mr/left/right` for layout. Existing animations have RTL keyframes.

## Existing components (`apps/web/src/components/`)

`ui/Button`, `ui/Input`, `ui/Toast`, `ui/ErrorBoundary`, `ui/ThemeToggle`, `layout/Header`,
`layout/Footer` — each with a `.spec.tsx`. Reuse and extend these before adding new primitives.

## Principles

1. **Mobile-first, one-handed**: the garden and the vet are the primary contexts. Primary actions
   reachable by thumb; quick-log in ≤ 3 taps (plan 6.2); camera capture on upload controls.
2. **Both kingdoms are first-class**: animal and plant flows share components; copy and icons
   adapt by `category` (sex hidden for plants, placement hidden for animals).
3. **Privacy is visible**: every surface shows its visibility state (private / members / public);
   precise location and documents are never rendered on public surfaces; "view as public" preview.
4. **Trust the warning**: every warning/recommendation carries a source badge and a "why".
5. **Four locales, always**: strings via next-intl keys; Hebrew reviewed for gender and RTL
   mirroring (icons with direction flip); Cyrillic text length ≈ 1.3× English — design for it.
6. **Accessible**: keyboard operable, focus visible, `prefers-reduced-motion` respected, contrast
   AA in both themes, form errors announced.
7. **Dark and light are equal citizens**: every new token gets both values; no hardcoded colors.

## Page templates (to be specified as phases arrive)

| Template           | First used | Notes                                                              |
| ------------------ | ---------- | ------------------------------------------------------------------ |
| Auth form page     | 1.7        | centered card, provider buttons, consent checkbox, locale switch   |
| Settings page      | 1.8        | sectioned; account / notifications / privacy / export later        |
| Dashboard grid     | 2.6        | card grid + filter chips + empty state that sells the create flow  |
| Entity page + tabs | 2.7        | header (avatar, name, species chain, status, visibility) + tab bar |
| Multi-step form    | 2.5        | category → species picker → details                                |
| Public page (SSR)  | 4.6        | anonymous, OpenGraph, coarse location label, social counts         |
| Timeline           | 5.3        | day-grouped, type icons, filters, search                           |
| Today board        | 6.5        | grouped by pet, swipe done/snooze                                  |

A spec for a page or component = purpose, states (empty / loading / error / populated), layout
per breakpoint, RTL notes, i18n keys, a11y notes, and which existing primitives it reuses.
