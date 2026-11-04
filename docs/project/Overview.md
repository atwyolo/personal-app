---
tags: [project]
updated: 2026-11-04
---

# Overview

**What:** a personal portfolio site. Content lives in files in the repository and changes with a deploy (since 2026-11-04, [[ADR-0015 Content in Files]]).

**Why:** two goals of equal weight — a working site, and learning Next.js fundamentals (App Router, Server Components, rendering modes, Server Actions, caching) by building it.

## Scope

Public pages: Home, About, Experience, Skills. The blog, the contact page and the admin were dropped on 2026-11-04.

## Constraints

- Hosting on Vercel Hobby (non-commercial, read-only filesystem at runtime).
- Nothing secret is stored; still, credentials live only in env vars.
- Everything in the repo is in English.
- The narrowest supported window is 360 px (owner's decision, 2026-11-03). Layout problems at a window height of 300 px or less are not a target.

## Stack summary

See [[ADR-0001 Framework and Rendering]], [[ADR-0005 UI Library]] and [[ADR-0015 Content in Files]]. Short version: Next 16 App Router · Tailwind v4 + shadcn/ui · next-intl · content in `messages/` (JSON + Markdown with frontmatter, `gray-matter` + Zod, `react-markdown`) · Vercel Blob for files.

Related: [[Roadmap]], [[Content Model]], [[Rendering Strategy]]
