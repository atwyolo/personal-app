---
tags: [project, roadmap]
updated: 2026-11-03
---

# Roadmap

Each stage ends with a working build.

**Home page** ([[2026-10-29-home-page-design]]): done 2026-11-02. It spans stages 1–3 and borrows blocks from later ones. Verification on Vercel: desktop 100 on all four, mobile 98, 100, 100, 100 (2026-11-01), measured before the sliding navigation and the contact buttons of 2026-11-02; the iOS simulator check passed ([[2026-10-30-home-motion]]).

**About page** ([[2026-11-02-about-page-design]]): done 2026-11-03, see [[2026-11-02-about-page]]. Three answers still hold the design's placeholders. Links in answers wait for the Rich text stage.

**Projects page** ([[2026-11-03-projects-page-design]]): done 2026-11-03, see [[2026-11-03-projects-page]]. Static, on the `experience` tables. Three jobs for now: Omega-R left the database (owner's decision). The roles and the full descriptions are demo content.

**Metadata tables** ([[2026-11-03-meta-tables-design]]): done 2026-11-03, see [[2026-11-03-meta-tables]] and [[ADR-0014 Metadata in the Database]]. Titles, descriptions, preview images, icons, the site name and `hidden_from_search` live in four `meta_` tables. The site is hidden from search engines until Stage 8. No icons are uploaded yet.

**Skills page** ([[2026-11-03-skills-page-design]]): done 2026-11-03, see [[2026-11-03-skills-page]]. Static, on the `skills` tables; every skill in the HTML, filtered on the client by a search that waits 300 ms and by domain chips. Metadata from `meta_pages`. Most levels are still the seed's placeholder 6.

**Blog list** ([[2026-11-03-blog-list-design]]): done 2026-11-04, see [[2026-11-03-blog-list]]. Partial Prerender: the state lives in the URL and is rendered on the server, with faceted counts, pagination (10, 20, 50) and the Skills panel's folding. `excerpt` and `body` became `content_short` and `content_full`; eleven demo posts. Mobile Lighthouse performance varies between 90 and 100 locally (the LCP is the first card, which streams after the shell): left for Stage 8 (owner's decision).

- [x] **Stage 0 — Scaffold** (2026-10-26): `create-next-app`, shadcn init, lint/type/build green, docs vault, `CLAUDE.md`.
- [x] **Stage 1 — Skeleton & theme** (2026-10-29): root layout, sticky header with desktop and mobile navigation, `next-themes` dark mode, base shadcn components, metadata API. No placeholder routes: links to missing pages go to the 404 page until those pages exist (owner's decision).
- [x] **Stage 2 — i18n** (2026-10-29): `next-intl`, `[locale]` segment, 8 locales, locale switcher, `generateStaticParams` for locales, localized metadata and `hreflang`. Only `en` has messages so far; the other locales fall back to it (see [[Localization]]).
- [x] **Stage 3 — Database** (2026-11-03): Neon via Vercel Marketplace, Drizzle schema with translation tables, `drizzle-kit push`, seed script, Home, About and Projects reading from the database, static with cache tags ([[Rendering Strategy]]).
- [ ] **Stage 4 — Blog**: posts + translations in DB, the list and the `[slug]` route, view counter. Two specs (owner, 2026-11-03): the data and the list (done 2026-11-04), then the post page and the view counter. Decided by the owner on 2026-11-03:
  - Both routes read through cached functions with tags, as Home; no time-based revalidation. The list became a Partial Prerender once its state moved into the URL ([[Rendering Strategy]]).
  - `post_translations.excerpt` becomes `content_short`, a plain string; `body` becomes `content_full`, the Tiptap JSON of the post page ([[Data Model]]). Home's cards read `content_short`.
  - The post body uses `RichText` as it is today: no new marks or nodes in this stage. The demo bodies keep to what it renders; the rest waits for the Rich text stage.
  - The filter panel behaves as on Skills, on desktop and on phones.
  - Pagination under the list: 10 posts per page by default, a selector offers 20 and 50. Filtering, sorting and paging run on the server, not in the browser.
  - Deep links: topic, tags, sort, page and page size live in the URL in a readable form. Opening such a link restores the state; a link that cannot be restored falls back to the default (first page, no filters).
  - Topic and tag counts are recomputed with every new request.
  - The list renders on the server from `searchParams` inside `<Suspense>`, behind a static shell; no Route Handler for it ([[Rendering Strategy]]).
  - Eight more demo posts in the database (11 in all); their content may repeat. The post body comes from the design's demo article.
  - Posts are written only in the admin editor, no Markdown import.
- [ ] **Stage 5 — Contact form**: Server Action, React Hook Form + Zod on the client, same schema on the server, honeypot, `useActionState`, messages table.
- [ ] **Stage 6 — Admin**: Auth.js v5 credentials login, route protection, admin layout mirroring site structure, CRUD per entity, a metadata section (site settings and per-page title, description and image, [[ADR-0014 Metadata in the Database]]; refresh with `updateTag("meta")`), Tiptap editor, TanStack Table lists, per-locale editing with fallback indicator.
- [ ] **Rich text** (owner's decision, 2026-11-02): the editor and the output together. Links, italic, underline and numbered lists in `src/shared/ui/RichText.tsx`, which shows them as plain text today. Links are the About page's call to action.
- [ ] **Stage 7 — Deploy**: Vercel project, env vars, Neon integration (single database, no preview branches), Vercel Blob for uploads. *In progress:* the public Blob store holds the photo and CV, uploaded by hand (2026-10-30); builds show their version, and pull requests into `develop` must raise it ([[ADR-0013 Version Tracking]], 2026-11-02).
- [ ] **Stage 8 — Polish**: sitemap/robots, OG images, loading/error boundaries, Suspense streaming, Lighthouse pass, `theme-color` following the chosen theme. `robots.txt` must allow everything while `hidden_from_search` is true: a crawler that may not load a page never sees its `noindex`. **Last step:** set `hidden_from_search` to false once the domain is connected, then request indexing in Search Console ([[ADR-0014 Metadata in the Database]]).

Later / optional: email notification for contact messages (Resend), machine-translation helper in admin (DeepL), analytics.
