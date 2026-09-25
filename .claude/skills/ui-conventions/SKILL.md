---
name: ui-conventions
description: Component and page conventions for the Next.js app — file placement, the UI kit primitives, Tailwind 4 semantic tokens and theming, RTL, client/server boundaries, async and error patterns. Use when building or reviewing anything under apps/web/src.
---

# UI conventions

Design system: `wiki/ui-design-system.md`; kit catalogue: `wiki/ui-kit.md`; adding or
extending a primitive: the `ui-kit` skill. Read the system page before a new surface.

- **Place**: routes `src/app/[locale]/<area>/page.tsx`; components `src/components/<domain>/`;
  primitives `src/components/ui/`; domain clients/types `src/lib/<domain>/`; hooks `src/hooks/`;
  test helpers `src/test/`; the dev-only showcase `src/components/kit/` + `[locale]/kit`.
- **Reuse**: `ui/{Button,LinkButton,IconButton,Spinner,Field,Input,Textarea,Select,Checkbox,
Switch,Card,Badge,Chip,Alert,Toast,Dialog,Skeleton,EmptyState,ThemeToggle,ErrorBoundary}`,
  `layout/{Header,Footer}` — compose and extend props before creating a sibling.
- **Styling**: Tailwind 4 utilities on the **semantic tokens** (`bg-surface`, `text-ink-muted`,
  `border-line-strong`, `bg-primary text-on-primary`, `bg-caution-soft text-caution-ink`),
  `rounded-control` / `rounded-card`, `shadow-soft` / `shadow-lift`; `cn()` from `src/lib/cn`
  for class merging; `focus-ring` on every focusable, `pressable` + `useRipple` on every
  pressable; no hex colours, no ramp shades with `dark:` in components; logical properties for
  RTL; motion under `motion-safe:` only.
- **Server vs client**: pages are server components; `'use client'` only for interactivity;
  browser-only libraries (Leaflet, players) load with `dynamic(..., { ssr: false })`. Server
  layouts pass translated strings to client class components (`ErrorBoundary messages`).
- **Data**: SSR fetches via `API_INTERNAL_URL`, browser via `NEXT_PUBLIC_API_URL` through
  `src/lib/api-client.ts` (envelope + error shape from `@green-fluffy/shared`).
- **Async and errors**: one loading/error convention per scope (page / container / control):
  `Skeleton` + `aria-busy` for regions, `Button loading` for actions, `Field error` for
  fields, `Alert` inline, `useToast` for transient feedback — the myfinpro `useAsyncOperation`
  pattern is the candidate for the hook; decide at 1.7 (`wiki/decisions.md`).
- **Strings**: next-intl keys only (`i18n` skill); primitives read the `ui` namespace; English
  source text lives in `messages/en.json`; the showcase is the documented English-only exception.
- **Public pages**: SSR, `generateMetadata`, no private data in HTML, coarse location only,
  `X-Robots-Tag: noindex` on owner previews.
- **Tests**: `*.spec.tsx` next to the component with `renderWithIntl` + `expectNoA11yViolations`;
  Playwright for flows; the kit scan (`e2e/kit.spec.ts`) covers RTL and both themes.
