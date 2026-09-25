# UI kit — component catalogue (checked 2026-09-25)

Primitives live in `apps/web/src/components/ui/`, one file per component with its `.spec.tsx`
beside it. Tokens and rules: [ui-design-system.md](ui-design-system.md). Adding or extending:
the `ui-kit` skill. Live reference: `/kit` (development and staging; 404 in production).

## Foundations

- `src/lib/cn.ts` — `cn()` = clsx + tailwind-merge with the kit's radius / shadow / ease /
  animation names registered, so a consumer's `className` overrides a default (`px-6` beats
  the kit's `px-5`). Register new token names of those four kinds there.
- `src/hooks/useRipple.tsx` — `{ onPointerDown, onKeyDown, rippleLayer }`. The host carries
  `pressable` (relative, overflow hidden) and renders `rippleLayer` as its first child. Pointer
  presses ripple from the pointer, Enter/Space from the centre; nothing under reduced motion;
  cleanup by a timer equal to the CSS animation (`RIPPLE_DURATION_MS`).
- `components/ui/styles.ts` — `stateLayerClassName` (hover/focus tint of `currentColor`, one
  rule for every variant and theme) and `controlClassName` (text controls: 44 px, 3:1 border,
  `focus-ring`, `aria-invalid` border).
- Icons: `lucide-react`. Always inside an `aria-hidden` wrapper unless the icon is the content
  (then `IconButton` with `label`). Sized by the parent (`[&_svg]:size-5`); directional icons
  get `rtl:-scale-x-100`.
- Strings inside primitives come from the `ui` namespace of `messages/*.json`: `close`,
  `dismiss`, `loading`, `optional`, `required`, `skipToContent`, `tone.{info,success,caution,danger,error}`.
  Consumers pass their own translated text through props.
- React 19 style: `ref` is an ordinary prop (no `forwardRef`); props extend
  `ComponentProps<'tag'>`; `'use client'` only where hooks or handlers exist (Card, Badge,
  Skeleton, EmptyState are server-safe).

## Catalogue

| Component                       | Purpose                             | Key props                                                                                                                     | Accessibility contract                                                                                                                                                   | Strings                   |
| ------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| `Button`                        | actions                             | `variant` primary/secondary/tonal/outline/ghost/danger, `size` sm/md/lg, `loading`, `leadingIcon`/`trailingIcon`, `fullWidth` | `type="button"` by default; `loading` = `aria-busy` + `aria-disabled`, focus kept, clicks swallowed; `disabled` native                                                   | —                         |
| `LinkButton`                    | navigation that looks like a button | `href` + the Button style/icon props                                                                                          | real `<a>` through next-intl `Link`; same ripple and ring                                                                                                                | —                         |
| `IconButton`                    | icon-only actions                   | `label` (required), `variant` ghost/tonal/outline/primary, `size`                                                             | `aria-label` + `title`; round; 36 / 44 / 52 px                                                                                                                           | —                         |
| `Spinner`                       | progress                            | `size`, `announce`, `label`                                                                                                   | decorative unless `announce` → `role="status"` with localised "Loading…"                                                                                                 | `ui.loading`              |
| `Field`                         | label / hint / error wiring         | `label`, `hint`, `error`, `required`, `optional`, `id`                                                                        | `<label for>`; `aria-describedby` = hint + error; error `role="alert"`; `aria-invalid`; `required` on the control                                                        | `ui.optional`             |
| `Input` / `Textarea` / `Select` | text controls                       | `startAdornment` / `endAdornment` (Input), `rows` (Textarea), `<option>` children (Select)                                    | take id and ARIA from `Field` (`useFieldControl`), or own id standalone; 44 px; 3:1 border                                                                               | —                         |
| `Checkbox`                      | booleans in forms                   | `label`, `description`, `error`                                                                                               | native input; the whole label row is the target; description/error in `aria-describedby`                                                                                 | —                         |
| `Switch`                        | immediate on/off settings           | `checked`, `onCheckedChange`, `label`, `description`                                                                          | `role="switch"` + `aria-checked`; `<label for>`; Space/Enter; thumb mirrored with `rtl:`                                                                                 | —                         |
| `Card`                          | surfaces                            | `tone` surface/sunken/primary/accent, `padding`, `interactive`, `as`                                                          | semantic tag via `as` (`li`, `article`, `section`); `cardClassName()` for link hosts                                                                                     | —                         |
| `Badge`                         | static labels                       | `tone` neutral/primary/accent/info/success/caution/danger, `size`, `icon`                                                     | text is the name; icon hidden; never clickable                                                                                                                           | —                         |
| `Chip`                          | toggles and filters                 | `selected`, `icon`, `count`                                                                                                   | `aria-pressed`; check mark when selected; count via `useFormatter`                                                                                                       | —                         |
| `Alert`                         | inline messages                     | `tone`, `emphasis` soft/strong, `title`, `actions`, `onDismiss`, `icon`                                                       | danger → `role="alert"`, else `role="status"`; sr-only tone prefix (`tonePrefix` overrides it — error toasts say "Error", hazards say "Danger"); labelled dismiss button | `ui.dismiss`, `ui.tone.*` |
| `Toast`                         | transient messages                  | `useToast().addToast(type, message, duration?)`; `ToastProvider` + `ToastContainer` in the layout                             | renders `Alert`; timer pauses on hover/focus; `duration: 0` sticks; at most 5; top-end, full width on phones                                                             | (Alert's)                 |
| `Dialog`                        | modal                               | `open`, `onClose`, `title`, `description`, `footer`, `size`, `dismissible`, `initialFocusRef`                                 | native `<dialog>` + `showModal()`: focus trap, inert page, Escape, focus return; named by the title                                                                      | `ui.close`                |
| `Skeleton`                      | loading placeholder                 | `shape` text/rect/circle                                                                                                      | `aria-hidden`; the loading region sets `aria-busy`                                                                                                                       | —                         |
| `EmptyState`                    | nothing-yet                         | `icon`, `title`, `description`, `action`, `headingLevel`                                                                      | heading level fits the page outline                                                                                                                                      | —                         |
| `ThemeToggle`                   | theme switch                        | —                                                                                                                             | `IconButton` labelled with the theme it switches to                                                                                                                      | `theme.*`                 |
| `ErrorBoundary`                 | render-error fallback               | `messages` {title, description, retry} from the server layout, `fallback`                                                     | strong danger `Alert` with a retry `Button`                                                                                                                              | `errors.*` (layout)       |

Layout pieces (`components/layout/`): `Header` (brand link, nav, locale `Select` with a hidden
label, `ThemeToggle`), `Footer`. The locale layout adds the skip link, `<main id="main">`, the
toast container and the font.

## Recipes

- **Form**: `<form noValidate>` of `Field`s; submit `Button type="submit"`, cancel
  `variant="ghost"`; API validation messages go into `Field error` (announced, control marked).
- **Confirmation**: `Dialog` with `initialFocusRef` on the Cancel button, `variant="danger"`
  confirm with `loading`, `dismissible={false}` while the action runs.
- **Filter row**: `Chip`s with `selected`; one `aria-pressed` per chip — no radio group needed.
- **Loading page**: a region with `aria-busy` and `Skeleton`s; `Spinner announce` for waits
  longer than a second; then the content (`animate-fade` if it pops in).
- **Severity → tone**: info → `info`, caution → `caution`, danger → `danger`, critical →
  `danger` + `emphasis="strong"`.
- **Porting from myfinpro**: `Input label/error` props became `Field`; `Button` gained
  `loading` and icon slots (no `ButtonSpinner`); `ConfirmDialog` is the confirmation recipe;
  `Spinner` matches except `announce`; Toast API (`addToast(type, message, duration)`) is unchanged.

## Tests and proof

- Unit: `renderWithIntl` (`src/test/render.tsx` — real messages, a missing key throws) +
  `expectNoA11yViolations` (`src/test/a11y.ts` — axe-core; colour contrast is disabled there
  because jsdom has no layout) + `@testing-library/user-event` for keyboard paths; the jsdom
  `<dialog>` shim lives in `src/test-setup.ts`.
- E2E: `apps/web/e2e/kit.spec.ts` — axe with WCAG 2.2 AA + best-practice tags over `/kit` in
  4 locales × 2 themes, plus visible focus ring, modal dialog (Escape, focus return, inert
  page), toast live region and keyboard dismiss, reduced-motion ripple. Run:
  `pnpm --filter @green-fluffy/web exec playwright test e2e/kit.spec.ts --project=chromium`.
- Lint: `jsx-a11y/recommended` on every `.tsx` (`packages/eslint-config/nextjs.js`).

## Showcase

`src/app/[locale]/kit/page.tsx` → `components/kit/KitShowcase.tsx`: every primitive in every
state. It is an English-only developer surface — the documented exception to the
no-hardcoded-strings rule — answers 404 in production and is `noindex`. A new component or
variant is not done until it has a section there.
