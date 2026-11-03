---
tags: [architecture]
updated: 2026-11-03
---

# Rendering Strategy

Deliberately mix rendering modes so each one is learned in practice. Every page file states its mode in a one-line comment.

| Route | Mode | Why |
|---|---|---|
| `/[locale]` (home) | static, DB-backed: `"use cache"` + `cacheLife("max")` + `cacheTag` per entity; admin calls `updateTag` | content changes rarely; built once per locale, refreshed only when edited |
| `/[locale]/about` | static | same |
| `/[locale]/projects` | static, DB-backed, as home: same `getExperience`, same tags, admin calls `updateTag` | content changes rarely; one read per locale serves both pages |
| `/[locale]/skills` | static, DB-backed, as home: the same `getSkills` read with the `skills` tag, handed to a client explorer that only filters | content changes rarely; the full list is in the HTML, so the page reads without JavaScript |
| `/[locale]/blog` | Partial Prerender (◐ in the build): the hero and a skeleton are the static shell; the panel, the list, the counts and the pagination read `searchParams` inside `<Suspense>`. Three `"use cache"` reads tagged `posts` and `post-topics` (catalog per locale, facets per filter, page per state), reached only by a state validated against the catalog. Every control is a link; `NavigationScope` pushes same-page links in a transition without scrolling and blocks clicks while pending | posts change rarely; the list can grow past what fits in one HTML page, so it is paginated on the server (owner's decision, 2026-11-03) |
| `/[locale]/blog/[slug]` | static, DB-backed: `generateStaticParams` + cached read per post, tagged; view counter via Server Action | post body changes only when edited; the counter is a mutation |
| `/[locale]/contact` | dynamic (Server Action) | form submission |
| `/admin/**` | dynamic, no caching | authenticated, always fresh |

The project runs with `cacheComponents: true`, so "ISR" means cached functions with tags, not a route-level `revalidate` export.

`cacheComponents` also keeps a left route in the DOM: `<Activity>` hides it with `display: none`. Its state survives, and a CSS animation on it restarts when the visitor comes back, which is why [[2026-10-30-home-motion]] needs `RevealOnce`. A locator such as `h1` can match the hidden page too.

`experimental.inlineCss` puts the CSS of a first load into a `<style>` tag instead of a render-blocking `<link>`, on every route. See [[ADR-0011 Inline CSS]].

Metadata comes from the `meta_` tables through `"use cache"` functions tagged `meta` ([[ADR-0014 Metadata in the Database]]): the root layout reads the site-wide part (default title, icons, `noindex` while hidden) and each page its own, so metadata stays in the static shell. `/favicon.ico` is a route handler on the same cached read; under Cache Components a `GET` that reads only cached data is prerendered too (`x-nextjs-cache: HIT`).

No route uses time-based revalidation: every DB-backed page is refreshed by `updateTag` from the admin (owner's decision for the blog, 2026-11-03).

Notes to expand: `loading.tsx` / `error.tsx` per segment.

Related: [[ADR-0001 Framework and Rendering]]
