---
tags: [project, roadmap]
updated: 2026-11-02
---

# Roadmap

Each stage ends with a working build.

**Home page** ([[2026-10-29-home-page-design]]): done 2026-11-02. It spans stages 1–3 and borrows blocks from later ones. Verification on Vercel: desktop 100 on all four, mobile 98, 100, 100, 100 (2026-11-01), measured before the sliding navigation; the iOS simulator check passed ([[2026-10-30-home-motion]]).

- [x] **Stage 0 — Scaffold** (2026-10-26): `create-next-app`, shadcn init, lint/type/build green, docs vault, `CLAUDE.md`.
- [x] **Stage 1 — Skeleton & theme** (2026-10-29): root layout, sticky header with desktop and mobile navigation, `next-themes` dark mode, base shadcn components, metadata API. No placeholder routes: links to missing pages go to the 404 page until those pages exist (owner's decision).
- [x] **Stage 2 — i18n** (2026-10-29): `next-intl`, `[locale]` segment, 8 locales, locale switcher, `generateStaticParams` for locales, localized metadata and `hreflang`. Only `en` has messages so far; the other locales fall back to it (see [[Localization]]).
- [ ] **Stage 3 — Database**: Neon via Vercel Marketplace, Drizzle schema with translation tables, `drizzle-kit push`, seed script, Projects page reading from DB with ISR. *In progress:* everything except the Projects page is done; the home page reads from the database.
- [ ] **Stage 4 — Blog**: posts + translations in DB, dynamic `[slug]` route, static params, Tiptap JSON → React renderer, view counter.
- [ ] **Stage 5 — Contact form**: Server Action, React Hook Form + Zod on the client, same schema on the server, honeypot, `useActionState`, messages table.
- [ ] **Stage 6 — Admin**: Auth.js v5 credentials login, route protection, admin layout mirroring site structure, CRUD per entity, Tiptap editor, TanStack Table lists, per-locale editing with fallback indicator.
- [ ] **Stage 7 — Deploy**: Vercel project, env vars, Neon integration (single database, no preview branches), Vercel Blob for uploads. *In progress:* the public Blob store holds the photo and CV, uploaded by hand (2026-10-30).
- [ ] **Stage 8 — Polish**: sitemap/robots, OG images, loading/error boundaries, Suspense streaming, Lighthouse pass.

Later / optional: email notification for contact messages (Resend), machine-translation helper in admin (DeepL), analytics.
