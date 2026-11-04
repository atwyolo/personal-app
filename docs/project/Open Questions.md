---
tags: [project]
updated: 2026-11-04
---

# Open Questions

- Privacy notice: mention the one-year `NEXT_LOCALE` cookie that remembers a language the visitor picked; a persistent preference cookie is commonly accepted under ePrivacy only when users are informed.
- Domain name for the Vercel project.
- The flaky e2e test "recomputes the bars when the phone turns" (`e2e/experience.spec.ts`): fails about once in three parallel runs of the spec, before and after the move to files (found 2026-11-04).

Closed on 2026-11-04 by [[ADR-0015 Content in Files]] (no admin, no database, no contact form): the admin's metadata section, drafts of About pairs, the separate `projects` list, an upload form, contact notifications, a second admin user.

Resolved questions move into an ADR in `decisions/`.
