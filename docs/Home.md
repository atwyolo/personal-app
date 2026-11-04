---
tags: [moc]
updated: 2026-11-04
---

# Home

Map of content for the `personal` site project. Open this folder as an Obsidian vault.

## Project
- [[Overview]] — goals, scope, constraints
- [[Roadmap]] — stages and their status
- [[Open Questions]] — things not decided yet

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
- [[ADR-0015 Content in Files]] — no database: content in `messages/` (JSON + Markdown)

## Specs
- [[2026-10-29-home-page-design]] — home page architecture, done 2026-11-02
- [[2026-11-02-about-page-design]] — About page: interview pairs in the database, done 2026-11-03
- [[2026-11-03-projects-page-design]] — Projects page (now Experience): work history, done 2026-11-03
- [[2026-11-03-meta-tables-design]] — metadata in four `meta_` tables, done 2026-11-03
- [[2026-11-03-skills-page-design]] — Skills page: search and domain filters, done 2026-11-03
- [[2026-11-03-blog-list-design]] — Blog list: deep links, server-side filters and pagination, dropped 2026-11-04
- [[2026-11-04-post-page-design]] — Post page: static, the lead text and the body, cards open it in a new tab, dropped 2026-11-04
- [[2026-11-04-content-in-files-design]] — no database: content in `messages/` (JSON + Markdown), blog, contact and admin removed, approved 2026-11-04

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
- [[2026-11-04-content-in-files]] — content in files, Tasks 0–9 done; Task 10 (delete Neon) waits for the production check

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

## Templates
- [[ADR Template]] · [[Journal Template]]
