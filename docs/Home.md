---
tags: [moc]
updated: 2026-11-11
---

# Home

Map of content for the `personal` site project. Open this folder as an Obsidian vault.

## Project
- [[Overview]] — goals, scope, constraints
- [[Roadmap]] — stages and their status
- [[Open Questions]] — things not decided yet
- [[Launch Plan]] — sections 1 and 2 done 2026-11-12; section 3, the launch itself, is next

## Architecture
- [[Rendering Strategy]] — which route uses static / ISR / dynamic and why
- [[Content Model]] — the files in `messages/`, their fields, merge and validation rules
- [[Localization]] — locales, fallback rules, where strings live

## Decisions (ADRs)
- [[ADR-0001 Framework and Rendering]]
- [[ADR-0002 Database and ORM]] — superseded by ADR-0015
- [[ADR-0003 Content Localization]] — superseded by ADR-0015
- [[ADR-0004 Hand-written Admin]] — superseded by ADR-0015
- [[ADR-0005 UI Library]]
- [[ADR-0006 Forms]]
- [[ADR-0007 Testing]]
- [[ADR-0008 Theme]]
- [[ADR-0009 Agent Workflow]] — superseded by ADR-0010
- [[ADR-0010 Superpowers Workflow]]
- [[ADR-0011 Inline CSS]]
- [[ADR-0012 Nav Indicator]]
- [[ADR-0013 Version Tracking]]
- [[ADR-0014 Metadata in the Database]] — superseded by ADR-0015
- [[ADR-0015 Content in Files]] — no database: content in `messages/` (JSON + Markdown); amended by ADR-0016
- [[ADR-0016 Metadata in Markdown]] — `Meta` moved to `meta.md`, JSON holds interface strings only
- [[ADR-0017 Test Content Fixtures]] — e2e tests build from frozen content in `e2e/content/`; no test reads `messages/`
- [[ADR-0018 Global Not Found]] — one server-rendered, localized 404 through `global-not-found.tsx`
- [[ADR-0019 Security Headers]] — CSP without nonces and five basic headers; the pages stay static
- [[ADR-0020 Session Locale Cookie]] — `NEXT_LOCALE` lives one browser session; no notice needed
- [[ADR-0021 Real User Monitoring]] — Vercel Speed Insights deferred

## Specs
- [[2026-10-29-home-page-design]] — home page architecture, done 2026-11-02
- [[2026-11-02-about-page-design]] — About page: interview pairs in the database, done 2026-11-03
- [[2026-11-03-projects-page-design]] — Projects page (now Experience): work history, done 2026-11-03
- [[2026-11-03-meta-tables-design]] — metadata in four `meta_` tables, done 2026-11-03
- [[2026-11-03-skills-page-design]] — Skills page: search and domain filters, done 2026-11-03
- [[2026-11-03-blog-list-design]] — Blog list: deep links, server-side filters and pagination, dropped 2026-11-04
- [[2026-11-04-post-page-design]] — Post page: static, the lead text and the body, cards open it in a new tab, dropped 2026-11-04
- [[2026-11-04-content-in-files-design]] — no database: content in `messages/` (JSON + Markdown), blog, contact and admin removed, done 2026-11-04
- [[2026-11-10-meta-in-markdown-design]] — metadata in `meta.md`, recursive per-field merge, done 2026-11-10
- [[2026-11-10-ui-translations-design]] — interface translated into all seven locales, 404 included, guarded by a translation test, done 2026-11-10
- [[2026-11-11-content-translations-design]] — tests on frozen fixtures, content translated into seven locales, done 2026-11-11
- [[2026-11-11-not-found-page-design]] — the 404 page: static design, server-rendered, localized, done 2026-11-11
- [[2026-11-11-launch-polish-design]] — Stage 8 before launch: the owner's nine decisions, well-known URLs, headers, the Lighthouse pass, done 2026-11-12
- [[2026-11-12-error-page-design]] — the Error page: static, localized, without the header, for both error boundaries, done 2026-11-12

## Plans
- [[2026-10-30-home-experience]] — Experience block, done; deferred items listed there
- [[2026-10-30-home-skills]] — My top skills block, done, reviewed by the owner
- [[2026-10-30-home-blog]] — Blog block with translated topics and clean-up, dropped 2026-11-04
- [[2026-10-30-home-motion]] — accent wipe, verification, sliding navigation and menus, done; deferred items listed there
- [[2026-11-02-about-page]] — About page, done
- [[2026-11-03-projects-page]] — Projects page, done
- [[2026-11-03-meta-tables]] — metadata tables, done
- [[2026-11-03-skills-page]] — Skills page, done
- [[2026-11-03-blog-list]] — Blog list, dropped 2026-11-04
- [[2026-11-04-post-page]] — Post page, dropped 2026-11-04
- [[2026-11-04-content-in-files]] — content in files, done; Neon deleted 2026-11-04
- [[2026-11-10-meta-in-markdown]] — metadata in Markdown, done
- [[2026-11-10-ui-translations]] — UI translations, done
- [[2026-11-11-content-translations]] — content translations and test fixtures, done
- [[2026-11-11-not-found-page]] — the 404 page, done
- [[2026-11-11-launch-polish]] — launch polish, done
- [[2026-11-12-error-page]] — the Error page and the favicon guard, done

## Journal
- [[2026-10-26]] — kickoff: decisions, scaffold
- [[2026-10-28]] — database layer for the home page
- [[2026-10-29]] — home page architecture, step 1: structure move and boundaries lint
- [[2026-10-30]] — home page: photo, Blob store, image optimization
- [[2026-10-31]] — home page: Experience block closed
- [[2026-11-01]] — home page: My top skills and Blog blocks, accent wipe, verification
- [[2026-11-02]] — home page closed: iOS check, sliding navigation, selected menu item, contact buttons; version tracking; About page started
- [[2026-11-03]] — About page closed: chips, Back link, reveal, JSON-LD; Projects page closed; Stage 3 done; metadata tables; Skills page; Blog decisions before the spec
- [[2026-11-04]] — Blog list and Post page built; then the foundation changed: content in files, blog removed, Projects → Experience
- [[2026-11-10]] — metadata moved to Markdown; the interface translated into seven languages
- [[2026-11-11]] — e2e tests on frozen fixtures; the content translated into seven languages; the 404 page
- [[2026-11-12]] — launch polish: well-known URLs, security headers, JSON-LD, session cookie, theme-color, Lighthouse pass; the Error page

## Templates
- [[ADR Template]] · [[Journal Template]]
