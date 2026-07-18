# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server (Turbopack, on by default in Next 16)
- `npm run build` — production build (Turbopack by default; fails if a custom Webpack config is present without `--webpack`)
- `npm start` — run the production build
- `npm run lint` — ESLint via flat config (`eslint.config.mjs`); `next lint` was removed in Next 16, so this is the only lint entry point
- No test suite is configured yet.

## Architecture

- Next.js 16.2.10 App Router, React 19.2, TypeScript (strict), Tailwind CSS 4.
- Single route currently exists: `app/layout.tsx` (root layout, Geist Sans/Mono fonts via `next/font/google`) and `app/page.tsx` (unmodified create-next-app landing page).
- `@/*` resolves to the repo root (see `tsconfig.json` `paths`).
- `@supabase/ssr` and `@supabase/supabase-js` are declared dependencies but not yet integrated — there is no Supabase client helper or auth code yet. `.env.local` defines `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (untracked, values not committed).

## Working in this Next.js version

This project pins Next.js 16.2.10, which has real breaking changes relative to older Next.js versions (and likely relative to training data). Full docs are vendored at `node_modules/next/dist/docs/` — check there before assuming an API works as remembered. Notable differences from Next 15 and earlier:

- **`middleware.ts` → `proxy.ts`**: the file convention and exported function are renamed to `proxy`. The `edge` runtime is not supported in `proxy` (it's `nodejs`-only); config flags like `skipMiddlewareUrlNormalize` are renamed too (`skipProxyUrlNormalize`).
- **Turbopack is the default** bundler for both `next dev` and `next build`; the `--turbopack` flag is no longer needed. Top-level `turbopack` config replaces `experimental.turbopack`.
- **`next lint` is removed**; the `eslint` key in `next.config.ts` is also gone. Lint via the ESLint CLI directly.
- Request-time APIs (`cookies()`, `headers()`, `draftMode()`, `params`, `searchParams`) are **async-only** now — the temporary sync compatibility from Next 15 is gone.
- `revalidateTag(tag)` requires a second `cacheLife` profile argument, e.g. `revalidateTag('posts', 'max')`. Use `updateTag` (Server Actions only) for read-your-writes semantics instead of forcing immediate revalidation.
- PPR/`experimental_ppr`, `experimental.dynamicIO`, and `experimental.useCache` are removed — use the top-level `cacheComponents` config flag instead.
- Parallel route slots (`@slot`) now require an explicit `default.js`, or the build fails.
- `serverRuntimeConfig`/`publicRuntimeConfig` are removed — use environment variables (`NEXT_PUBLIC_*` for client-exposed values) instead.
