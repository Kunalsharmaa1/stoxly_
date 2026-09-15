# Stoxly — Next.js (App Router)

This is the Figma-exported Vite/React UI converted into a real **Next.js 14 (App Router)** app,
with proper file-based routing instead of the original `useState` screen switcher.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS v3 (utility classes + the original custom CSS component classes in `globals.css`)
- Recharts v2 (charts on Portfolio, AI Intelligence, Backtest screens)

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/login`.

```bash
npm run build   # production build (verified working)
npm run start   # run the production build
```

## What changed vs. the Figma export

The original app was a single-page app: one `App.tsx` held a `screen` state variable and
manually rendered whichever screen matched, with an `onNavigate(screen)` callback passed
down everywhere. That's fine for a prototype, but isn't how a real Next.js app should work.

This version:

1. **Real routes.** Every screen is now its own route under `src/app/`:

   | Screen              | Route          |
   |----------------------|----------------|
   | Login                | `/login`       |
   | Dashboard            | `/dashboard`   |
   | Stock Analysis       | `/stock`       |
   | AI Intelligence      | `/ai`          |
   | Watchlist            | `/watchlist`   |
   | Strategy Builder     | `/strategy`    |
   | Backtester           | `/backtest`    |
   | Backtest History     | `/history`     |
   | Portfolio            | `/portfolio`   |
   | Settings             | `/settings`    |

   `/` just redirects to `/login`.

2. **Shared authenticated layout.** All routes except `/login` live in the `(app)` route
   group (`src/app/(app)/layout.tsx`), which renders the `Sidebar` + `TopBar` once and wraps
   `children` — instead of every screen manually being wrapped in the same markup.

3. **Navigation.** `Sidebar` now uses `next/link` + `usePathname()` to highlight the active
   route (no more `current`/`onNavigate` props passed down). The screen components
   (`Dashboard`, `StockResearch`, etc.) still expose the original `onNavigate(screen)` prop
   for backward compatibility with their internal buttons ("View all →", "Run Backtest",
   etc.) — it's now backed by `useAppNavigate()` (`src/lib/useAppNavigate.ts`), a thin hook
   around `useRouter().push()`, mapped through `src/lib/navigation.ts`.

4. **Client components.** Every screen/component uses hooks (`useState`, event handlers,
   Recharts), so they're all marked `'use client'`. Route `page.tsx` files that need
   `useAppNavigate()` are client components too; the couple of screens with no internal
   navigation (`AIIntelligence`, `Portfolio`, `Settings`) are left as plain server components.

5. **Styling.** `src/index.css` → `src/app/globals.css`, switched from the Vite/Tailwind v4
   `@theme` syntax to standard Tailwind v3 `@tailwind` directives + CSS custom properties
   (all your `--bg`, `--green`, `.card`, `.btn-primary`, `.badge-*` etc. classes are
   untouched). Fonts (Inter, JetBrains Mono) are still loaded via the same Google Fonts
   `@import` — swap this for `next/font/google` if you want self-hosted fonts (recommended
   for production, just needs network access at build time).

## Project structure

```
src/
  app/
    layout.tsx              # root layout, loads globals.css
    page.tsx                # redirects "/" -> "/login"
    login/page.tsx
    (app)/
      layout.tsx             # Sidebar + TopBar shell
      dashboard/page.tsx
      stock/page.tsx
      ai/page.tsx
      watchlist/page.tsx
      strategy/page.tsx
      backtest/page.tsx
      history/page.tsx
      portfolio/page.tsx
      settings/page.tsx
    globals.css
  components/
    Sidebar.tsx              # rewritten: next/link + usePathname
    TopBar.tsx                # rewritten: useAppNavigate for search-select nav
    Sparkline.tsx             # unchanged
  screens/                    # your original screens, verbatim logic
    Dashboard.tsx
    StockResearch.tsx
    AIIntelligence.tsx
    Watchlist.tsx
    StrategyLab.tsx
    BacktestResults.tsx
    BacktestHistory.tsx
    Portfolio.tsx
    Login.tsx
  lib/
    navigation.ts             # Screen <-> route path map
    useAppNavigate.ts          # useRouter()-backed onNavigate replacement
  types.ts                     # Screen union type, unchanged
```

## Notes / next steps

- All data in the screens is still hardcoded mock data (same as the Figma export) — wiring
  up Upstox/yfinance/nsepython for live NSE data is a separate step.
- There's no real auth yet — `Login` just navigates to `/dashboard` on submit. When you add
  real auth, gate the `(app)` route group with middleware or a session check in its layout.
- Recharts was pinned to v2.x (rather than the v3 the Figma export used) for stability with
  React 18 / Next 14. Bump both together later if you want v3's newer features.
