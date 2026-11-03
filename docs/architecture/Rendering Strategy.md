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
| `/[locale]/blog` | ISR | list of posts |
| `/[locale]/blog/[slug]` | static params + ISR; view counter via Server Action | post body is static, counter is a mutation |
| `/[locale]/contact` | dynamic (Server Action) | form submission |
| `/admin/**` | dynamic, no caching | authenticated, always fresh |

The project runs with `cacheComponents: true`, so "ISR" means cached functions with tags, not a route-level `revalidate` export.

`cacheComponents` also keeps a left route in the DOM: `<Activity>` hides it with `display: none`. Its state survives, and a CSS animation on it restarts when the visitor comes back, which is why [[2026-10-30-home-motion]] needs `RevealOnce`. A locator such as `h1` can match the hidden page too.

`experimental.inlineCss` puts the CSS of a first load into a `<style>` tag instead of a render-blocking `<link>`, on every route. See [[ADR-0011 Inline CSS]].

Metadata comes from the `meta_` tables through `"use cache"` functions tagged `meta` ([[ADR-0014 Metadata in the Database]]): the root layout reads the site-wide part (default title, icons, `noindex` while hidden) and each page its own, so metadata stays in the static shell. `/favicon.ico` is a route handler on the same cached read; under Cache Components a `GET` that reads only cached data is prerendered too (`x-nextjs-cache: HIT`).

Notes to expand: streaming with `Suspense` on the blog list, `loading.tsx` / `error.tsx` per segment.

Related: [[ADR-0001 Framework and Rendering]]
