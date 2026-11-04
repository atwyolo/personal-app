---
tags: [architecture]
updated: 2026-11-04
---

# Rendering Strategy

Every page file states its mode in a one-line comment. Since 2026-11-04 all content comes from files ([[ADR-0015 Content in Files]]), so every route is static and changes only with a deploy.

| Route | Mode | Why |
|---|---|---|
| `/[locale]` (home) | static: each block reads its own `"use cache"` + `cacheLife("max")` getter from `src/content/` | the content is in the repository; it changes with a deploy |
| `/[locale]/about` | static, as home | same |
| `/[locale]/experience` | static, as home: the same `getExperience` as Home's cards | one read per locale serves both pages |
| `/[locale]/skills` | static, as home: `getSkills`, handed to a client explorer that only filters | the full list is in the HTML, so the page reads without JavaScript |
| `/[locale]/[...rest]` | dynamic: `notFound()` for any unknown path, rendered inside the locale layout | the 404 page keeps the header and the locale |

The project runs with `cacheComponents: true`. Content is read with `fs.readFileSync`, which Cache Components treat as predictable (prerendered with the page); the getters stay `"use cache"` functions so that several blocks share one read per locale and Experience can read the clock for a running job. There are no cache tags and no time-based revalidation.

**Runtime reads.** A render at request time (the 404 of an unknown path, whose header shows the profile name) runs in a Vercel function that holds only traced files. `outputFileTracingIncludes: { "/**": ["./messages/**/*.md"] }` in `next.config.ts` adds the Markdown files to every server route; the JSON messages are traced because `load-messages.ts` imports them.

`cacheComponents` also keeps a left route in the DOM: `<Activity>` hides it with `display: none`. Its state survives, and a CSS animation on it restarts when the visitor comes back, which is why [[2026-10-30-home-motion]] needs `RevealOnce`. A locator such as `h1` can match the hidden page too.

`experimental.inlineCss` puts the CSS of a first load into a `<style>` tag instead of a render-blocking `<link>`, on every route. See [[ADR-0011 Inline CSS]].

Metadata comes from `Meta` in the merged messages through `"use cache"` getters (`src/content/meta.ts`): the root layout reads the site-wide part (default title, icons, `noindex` while hidden) and each page its own, so metadata stays in the static shell. `/favicon.ico` is a route handler on the same cached read; under Cache Components a `GET` that reads only cached data is prerendered too.

Until 2026-11-04 the blog list was a Partial Prerender and the post page used `ensureStatic = "navigation"`; both left with the blog ([[2026-11-04-content-in-files-design]]).

Notes to expand: `loading.tsx` / `error.tsx` per segment.

Related: [[ADR-0001 Framework and Rendering]], [[Content Model]]
