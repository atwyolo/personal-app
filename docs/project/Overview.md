---
tags: [project]
updated: 2026-11-03
---

# Overview

**What:** a personal portfolio site with a blog, a contact form and a self-written admin panel.

**Why:** two goals of equal weight — a working site, and learning Next.js fundamentals (App Router, Server Components, rendering modes, Server Actions, caching) by building it.

## Scope

Public pages: Home, About, Projects, Blog (list + post), Contact.
Admin (`/admin`): login, a menu mirroring the public structure, CRUD forms per entity, rich text editing for long-form fields.

## Constraints

- Hosting on Vercel Hobby (non-commercial, read-only filesystem at runtime).
- Database must fit the Neon Free plan (1 GB storage, 100 compute-hours/month, scale-to-zero after 5 min idle).
- Nothing secret is stored; still, credentials live only in env vars.
- Everything in the repo is in English.
- The narrowest supported window is 360 px (owner's decision, 2026-11-03). Layout problems at a window height of 300 px or less are not a target.

## Stack summary

See [[ADR-0001 Framework and Rendering]] through [[ADR-0006 Forms]]. Short version: Next 16 App Router · Tailwind v4 + shadcn/ui · Neon + Drizzle · next-intl · Auth.js v5 · Tiptap · React Hook Form + Zod.

Related: [[Roadmap]], [[Data Model]], [[Rendering Strategy]]
