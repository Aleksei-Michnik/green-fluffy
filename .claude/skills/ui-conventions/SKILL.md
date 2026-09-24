---
name: ui-conventions
description: Component and page conventions for the Next.js app — file placement, existing primitives, Tailwind 4 tokens and theming, RTL, client/server boundaries, async and error patterns. Use when building or reviewing anything under apps/web/src.
---

# UI conventions

Design system and page templates: `wiki/ui-design-system.md` (read before a new surface).

- **Place**: routes `src/app/[locale]/<area>/page.tsx`; components `src/components/<domain>/`;
  primitives `src/components/ui/`; domain clients/types `src/lib/<domain>/`; hooks `src/hooks/`.
- **Reuse**: `ui/{Button,Input,Toast,ErrorBoundary,ThemeToggle}`, `layout/{Header,Footer}` —
  extend props before creating a sibling.
- **Styling**: Tailwind 4 utilities on `@theme` tokens (`primary-*`); no hardcoded colors; both
  themes via the `dark` variant; logical properties for RTL; `prefers-reduced-motion` respected.
- **Server vs client**: pages are server components by default; `'use client'` only for
  interactivity; browser-only libraries (Leaflet, players) load with `dynamic(..., { ssr: false })`.
- **Data**: SSR fetches via `API_INTERNAL_URL`, browser via `NEXT_PUBLIC_API_URL` through
  `src/lib/api-client.ts` (envelope + error shape from `@green-fluffy/shared`).
- **Async and errors**: one loading/error convention per scope (page / container / control) —
  the myfinpro `useAsyncOperation` pattern is the candidate; decide at 1.7 (`wiki/decisions.md`)
  and then never use ad-hoc `useState` loading flags.
- **Strings**: next-intl keys only (`i18n` skill); English source text lives in `messages/en.json`.
- **Public pages**: SSR, `generateMetadata`, no private data in HTML, coarse location only,
  `X-Robots-Tag: noindex` on owner previews.
- **Tests**: `*.spec.tsx` next to the component; Playwright for flows; RTL check for `he`.
