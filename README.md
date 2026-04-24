# Furpathy Web

Multilingual pet-care blog built on Next.js 16 (App Router), React 19, Tailwind 4,
and Supabase. Statically generated with ISR; on-demand revalidation via a webhook
endpoint.

## Stack

- **Next.js 16.2** (App Router, Turbopack, ISR, `generateStaticParams`)
- **React 19**
- **next-intl 4.9** — four locales: `en`, `es`, `de`, `pt`; prefix always present
- **Supabase** (self-hosted, anon key only) as the read-only CMS
- **Tailwind 4** + `@tailwindcss/typography`
- **Vitest 4** + Testing Library (jsdom opt-in per file)
- **pnpm 9**

## Architecture

- `app/[locale]/` — locale-scoped routes. `setRequestLocale` is called in every
  server component to enable static generation.
- `app/api/revalidate/route.ts` — POST-only webhook; revalidates all affected
  paths when an article is published/edited in Supabase.
- `app/sitemap.ts`, `app/robots.ts`, `app/[locale]/rss.xml/route.ts` — SEO
  surfaces, all ISR with `revalidate = 600`.
- `lib/articles.ts` — data access; `columnsFor(locale)` returns only that
  locale's columns, `PROBE_COLUMNS` is a no-`content_*` projection used by
  sitemap / redirect logic.
- `lib/supabase.ts` — Supabase client wrapped in `fetchWithRetry` (7 attempts,
  exponential backoff, detects HTML proxy errors). `SUPABASE_BUILD_STUB=1`
  short-circuits all requests to an empty JSON array (for CI builds without
  credentials).
- `lib/tags.ts` — tag aggregation happens in JS because PostgREST can't unnest;
  results are cached via `unstable_cache` with tag `articles:tags`.
- `i18n/routing.ts` — locale list and `localePrefix: "always"`. Add a locale
  here plus a `messages/<locale>.json` file to support it.
- `middleware.ts` — next-intl routing middleware.

## Supabase schema

Table `articles` has a shared section (id, image_url, status, medium_url,
created_at, published_at) and per-locale columns:

- EN: `slug`, `title`, `meta_description`, `tags`, `content_en`
- Other locales: `slug_<lc>`, `title_<lc>`, `meta_description_<lc>`,
  `tags_<lc>`, `content_<lc>` where `<lc>` is `es`, `de`, or `pt`.

`status` is `draft | queued | published`. The app treats `queued` and
`published` as publicly visible so scheduled posts appear as soon as ISR
refreshes. A translation is considered "published" when both its `slug_<lc>`
and `title_<lc>` (and for rendered article pages, `content_<lc>`) are non-null.

RLS: the anon role must have SELECT access to `articles`. Writes go through
the service role from the content pipeline (not from this app).

## Environment

Required:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Optional:

```env
NEXT_PUBLIC_SITE_URL=https://furpathy.com   # overrides the default in lib/site-config.ts
REVALIDATE_SECRET=<random-long-string>       # required to call /api/revalidate
SUPABASE_BUILD_STUB=1                         # CI-only: short-circuits Supabase fetches
```

## Development

```bash
pnpm install
pnpm dev                   # http://localhost:3000
pnpm typecheck
pnpm lint
pnpm format                # prettier --write
pnpm test                  # vitest watch
pnpm test:run              # vitest run (CI)
pnpm build                 # production build
```

Pre-commit runs `lint-staged` (ESLint + Prettier on staged files) via husky.

## On-demand revalidation

Supabase triggers a POST to `/api/revalidate` with
`Authorization: Bearer <REVALIDATE_SECRET>` and a JSON body
`{ "paths": ["/", "/articles/..."] }` (optional). The route revalidates
every locale's home, article list, article detail, tag pages, and RSS feed,
plus the sitemap.

## Deployment

Any platform that supports Next.js standalone output. Set the env vars above
and make sure the build command is `pnpm build`. ISR pages refresh every
10 minutes (`revalidate = 600`); on-demand revalidation is instant via
`/api/revalidate`.

## CI

`.github/workflows/ci.yml` runs on push/PR to `master`:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test:run`
5. `pnpm build` — with `SUPABASE_BUILD_STUB=1` so no real Supabase creds are
   needed in CI. All data queries resolve to empty results; the build verifies
   typing, bundling, and SSG wiring only.
