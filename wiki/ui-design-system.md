# UI design system (checked 2026-09-25)

Owned by `ui-designer`; built by `web-coder` with the `ui-kit` skill. This page is the source of
truth for the mood, tokens and rules. The component catalogue is [ui-kit.md](ui-kit.md); the
live reference is `/kit` (development and staging only).

## Mood

Bright, warm and spacious. The green of new leaves for the brand and every primary action; a warm
apricot ("fluff") accent for the animal side and moments of joy; a warm off-white canvas and
moss-dark ink instead of cold greys. Generous padding, 44 px controls (garden, one hand). Flat
surfaces with soft shadows and rounded shapes. Motion is quick and settles without bouncing:
ripples spread from the pointer, dialogs and toasts rise into place, and everything is calm under
`prefers-reduced-motion`.

## Tokens (`apps/web/src/app/globals.css`)

Three layers, in this order in the file:

1. **Static ramps** in `@theme`: `primary-50…950` (leaf), `accent-50…950` (fluff), radii
   `control` (14 px, controls) and `card` (20 px, surfaces), easings `soft` / `spring`, named
   animations `rise` / `fade` / `pop`, and the font stack (`Rubik Variable`, self-hosted via
   `@fontsource-variable/rubik`; covers Latin, Cyrillic and Hebrew — verified 2026-09-25).
2. **Semantic, theme-aware tokens**: raw values `--gf-*` on `:root` (light) and
   `[data-theme='dark']`, exposed by `@theme inline` as utilities whose value resolves where they
   are used. **Components use only these**; ramps are for decorative gradients and the showcase.
3. **Two utilities** every interactive element carries: `focus-ring` (3 px solid ring in `focus`,
   offset 2 px, on `:focus-visible` only) and `pressable` (relative + overflow hidden + colour
   transitions + a 2 % press when motion is allowed).

| Token                                                                                   | Utilities                                         | Use                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `canvas`, `surface`, `surface-raised`, `surface-sunken`                                 | `bg-canvas`, `bg-surface` …                       | page, cards, popovers/dialogs, wells and disabled fields                                                                                        |
| `ink`, `ink-muted`, `ink-subtle`                                                        | `text-ink`, `text-ink-muted` …                    | text hierarchy; all three ≥ 4.5:1 on canvas, surface and sunken                                                                                 |
| `line`, `line-strong`                                                                   | `border-line`, `border-line-strong`               | decorative dividers / control borders (≥ 3:1 — required for inputs, switches, chips)                                                            |
| `primary`, `primary-hover`, `on-primary`, `primary-soft`, `primary-ink`                 | `bg-primary text-on-primary`, `bg-primary-soft …` | brand actions, tonal surfaces, links (`text-primary-ink`)                                                                                       |
| `accent`, `accent-hover`, `on-accent`, `accent-soft`, `accent-ink`                      | `bg-accent`, `text-accent-ink` …                  | the animal side, highlights, eyebrows; text on `accent` is dark in both themes                                                                  |
| `info`, `success`, `caution`, `danger` (+ `-soft`, `-ink`; `danger-hover`, `on-danger`) | `bg-caution-soft text-caution-ink`, `bg-danger …` | tones of Alert, Badge, Toast. Plan severities: info → `info`, caution → `caution`, danger → `danger`, critical → `danger` + `emphasis="strong"` |
| `focus`                                                                                 | `outline-focus` (through `focus-ring` only)       | the one focus indicator                                                                                                                         |
| `scrim`                                                                                 | `bg-scrim`                                        | dialog backdrop                                                                                                                                 |
| `shadow-soft`, `shadow-lift`                                                            | `shadow-soft`, `shadow-lift`                      | resting cards / hover, dialogs, toasts                                                                                                          |

A component that needs a colour the table lacks gets a **new semantic token in both themes**:
here first, then `globals.css`, then (for a radius/shadow/ease/animation name) `src/lib/cn.ts`.
Never a hex value, never a ramp shade with `dark:` overrides in a component.

## Contrast (verified 2026-09-25, WCAG 2 formula, both themes)

| Pair                                                | Min   | Light | Dark  |
| --------------------------------------------------- | ----- | ----- | ----- |
| ink on canvas / surface                             | 4.5:1 | 15.1  | 14.3  |
| ink-muted on canvas / surface                       | 4.5:1 | 6.2   | 8.5   |
| ink-subtle on canvas / sunken                       | 4.5:1 | 5.0   | 6.7   |
| on-primary on primary                               | 4.5:1 | 5.1   | 9.4   |
| primary as text on canvas / surface                 | 4.5:1 | 5.0   | 9.5   |
| primary-ink on primary-soft                         | 4.5:1 | 7.0   | 9.3   |
| on-accent on accent                                 | 4.5:1 | 5.3   | 8.7   |
| accent-ink on accent-soft                           | 4.5:1 | 5.3   | 9.4   |
| tone-ink on tone-soft (info/success/caution/danger) | 4.5:1 | ≥ 7.0 | ≥ 8.5 |
| on-danger on danger                                 | 4.5:1 | 5.1   | 7.9   |
| focus ring vs canvas / surface                      | 3:1   | 7.7   | 11.9  |
| line-strong vs canvas / surface                     | 3:1   | 3.7   | 3.5   |
| tone icons vs canvas                                | 3:1   | 4.1   | 7.8   |

Re-run the check when a token changes (script pattern: relative luminance per WCAG 2, ratio
`(L1 + 0.05) / (L2 + 0.05)`); the Playwright kit scan also checks contrast in a real browser.

## Type, space, shape

- Type: `text-4xl/5xl font-semibold tracking-tight` display, `text-2xl font-semibold` sections,
  `text-xl font-semibold` card titles, `text-base` body (`ink`), `text-base text-ink-muted`
  secondary, `text-sm text-ink-subtle` captions. `text-balance` on headings, `text-pretty` on
  lead paragraphs. Never below `text-sm` for content.
- Space: controls `h-9 / h-11 / h-13` (sm/md/lg, 36/44/52 px); cards `p-6` (`p-4` dense,
  `p-8` hero); section gaps `gap-6`–`gap-8`; page gutter `px-4 sm:px-6 lg:px-8`, content
  `max-w-6xl`, reading width `max-w-prose`.
- Shape: `rounded-control` for controls and fields, `rounded-card` for surfaces, `rounded-full`
  for chips, badges, icon buttons, avatars.

## Motion

- Feedback: ripple from the pointer (`useRipple`; centred for Enter/Space), hover/focus state
  layer (8 % of the text colour), 2 % press. Enter: `animate-rise` (toasts), `.dialog`
  `@starting-style` (dialogs), `animate-pop` (popovers), `animate-fade`. Durations 150–350 ms,
  `ease-soft`.
- Reduced motion: one global rule in `globals.css` collapses every animation and transition;
  `useRipple` spawns nothing; spinners keep turning, slowly (essential motion). Components add no
  per-case handling.

## Accessibility rules (every surface)

1. Native element first: `button`, `a`, `input`, `select`, `dialog`; ARIA only for what HTML
   lacks (`role="switch"`, `aria-pressed`).
2. Every control has a name: a visible label, or `label` → `aria-label` for icon-only controls;
   icons are `aria-hidden` unless they are the content.
3. Keyboard parity with the pointer: Tab order follows reading order, Enter/Space activate,
   Escape closes, focus is visible (`focus-ring`) and returns after a modal.
4. State in ARIA: `aria-invalid` + `aria-describedby` for errors, `aria-busy` for loading,
   `aria-pressed/checked/expanded` for toggles; feedback in live regions (`status` polite,
   `alert` assertive).
5. Targets ≥ 44 px on the default size; ≥ 24 px never undercut. Text ≥ 4.5:1, UI ≥ 3:1, both
   themes (table above).
6. Skip link to `main` in the layout; one `h1` per page; `EmptyState`/`Dialog` headings fit the
   outline (`headingLevel`).
7. Proof: `expectNoA11yViolations` in the unit test, a section in `/kit` so the Playwright axe
   scan covers it, `jsx-a11y` lint clean.

## Localisation rules

- No literal user-facing text in components; primitives read the `ui` namespace, consumers pass
  translated props. Keys exist in all four `messages/*.json` or in none.
- Layout with logical properties (`ps-`, `pe-`, `ms-`, `start-`, `end-`, `text-start`);
  directional icons `rtl:-scale-x-100`; positions physical only when computed from pointer
  coordinates (ripple).
- No fixed widths on text (Cyrillic ≈ 1.3× English); numbers and dates through `useFormatter`;
  Hebrew checked in the `he` showcase run.

## Principles (product)

1. **Mobile-first, one-handed** — garden and vet are the contexts; primary actions thumb-reachable.
2. **Both kingdoms are first-class** — shared components; copy and icons adapt by category.
3. **Privacy is visible** — every surface shows its visibility state; public surfaces never
   render precise location or documents.
4. **Trust the warning** — every warning carries a source badge and a "why".
5. **Dark and light are equal citizens** — a token exists in both themes or not at all.

## Page templates (specified as phases arrive)

| Template           | First used | Notes                                                                |
| ------------------ | ---------- | -------------------------------------------------------------------- |
| Auth form page     | 1.7        | centered Card, provider buttons, consent Checkbox, locale switch     |
| Settings page      | 1.8        | sectioned; Switch rows for privacy/notifications                     |
| Dashboard grid     | 2.6        | Card grid + Chip filters + EmptyState that sells the create flow     |
| Entity page + tabs | 2.7        | header (avatar, name, species chain, Badge status/visibility) + tabs |
| Multi-step form    | 2.5        | category cards → species picker → Fields                             |
| Public page (SSR)  | 4.6        | anonymous, OpenGraph, coarse location label, social counts           |
| Timeline           | 5.3        | day-grouped, type icons, Chip filters, search Input                  |
| Today board        | 6.5        | grouped by pet, swipe done/snooze                                    |

A spec for a page or component = purpose, states (empty / loading / error / populated), layout
per breakpoint, RTL notes, i18n keys, a11y notes, and which primitives it reuses.
