---
name: ui-kit
description: How to reuse, extend or add a primitive in apps/web/src/components/ui — the catalogue, tokens-only styling, the accessibility and localisation contract, tests, the /kit showcase and docs. Use when a UI task needs a component, when a primitive lacks a prop or variant, or when someone proposes a new one.
---

# UI kit — reuse first, extend second, add last

Catalogue and recipes: `wiki/ui-kit.md`. Tokens, contrast and rules: `wiki/ui-design-system.md`.
Live reference: `/kit` (dev/staging). Every step below is checked by the gate at the end.

## 1. Reuse

- Find it in the catalogue; compose (`Card` + `Badge` + `Button`) before inventing. Domain
  components live in `components/<domain>/` and are built from primitives.
- Change looks only through `className` (`cn()` resolves conflicts) and documented props; never
  copy a primitive's classes or reach into its markup.

## 2. Extend (a prop or variant)

Add to the variant map with static class strings and semantic tokens only; keep the a11y
contract; add a test case, a showcase example and the catalogue row's new value.

## 3. Add a primitive — checklist

1. **Spec** in `docs/ui/` (`ui-designer` format) unless trivial: purpose, states, breakpoints,
   RTL, i18n keys, a11y.
2. **File** `components/ui/<Name>.tsx` + `<Name>.spec.tsx`; named export; props extend
   `ComponentProps<'tag'>`; React 19 `ref` prop, no `forwardRef`; `'use client'` only with hooks
   or handlers.
3. **Style** with `cn()` and semantic tokens (`bg-surface`, `text-ink-muted`,
   `border-line-strong`); `focus-ring` on anything focusable; `pressable` + `useRipple` on
   anything pressed; logical properties (`ps-`, `end-`, `rtl:`); no `dark:` unless a token cannot
   express it; motion only through `motion-safe:` and the named animations. New token → both
   themes in `globals.css`, contrast checked, table in the design-system page updated,
   `cn.ts` registration for radius/shadow/ease/animate names.
4. **Accessibility**: native element first; a name for every control (visible label or a
   required `label` prop → `aria-label`); state in ARIA (`aria-pressed/checked/busy/invalid`);
   keyboard parity (Enter/Space/Escape/arrows per pattern); feedback in live regions (`status`
   polite, `alert` assertive); targets ≥ 44 px at `md`; text ≥ 4.5:1 and UI ≥ 3:1 in both themes.
5. **Localisation**: no literal user-facing text; internal strings under `ui.*` in all four
   `messages/*.json` (`i18n` skill; `i18n-translator` reviews); numbers/dates via
   `useFormatter`; no fixed widths; Hebrew seen in the `he` showcase run.
6. **Tests**: `renderWithIntl` + roles and names, keyboard with `user-event`,
   `expectNoA11yViolations`, one non-English locale assertion; a section in `KitShowcase` so
   `e2e/kit.spec.ts` scans it in the eight locale × theme runs.
7. **Docs**: catalogue row in `wiki/ui-kit.md`; rule or token changes in
   `wiki/ui-design-system.md`; `pnpm format`.

## Gate

```bash
pnpm --filter @green-fluffy/web lint && pnpm --filter @green-fluffy/web typecheck && pnpm --filter @green-fluffy/web test
pnpm --filter @green-fluffy/web exec playwright test e2e/kit.spec.ts --project=chromium   # stack up (local-stack)
```

Done = both green, the showcase shows the new state, the catalogue row exists.
