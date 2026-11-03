---
tags: [project]
updated: 2026-11-03
---

# Open Questions

- The admin's metadata section: [[Admin Handoff]] has no design for the `meta_` tables (site settings with icon uploads, per-page title, description and preview image per locale). Needed before Stage 6, see [[ADR-0014 Metadata in the Database]].
- Drafts of About pairs: the admin's "Needs answer" badge implies saving a pair without an answer, while the `en` check requires all five texts. A nullable field or a status? Settled at the admin stage.
- Is a separate `projects` list still needed? The Projects page shows work history from `experience`, and [[Data Model]] keeps the `projects` tables under "Later stages" until this is answered.
- Blog authoring: everything through the admin editor, or allow importing Markdown? (Default: editor only.)
- Media: the Blob store exists since 2026-10-30 (files uploaded by hand in the dashboard). Does the admin in Stage 6 need an upload form, or are pasted URLs enough at first?
- Privacy notice (by Stage 5, contact form): mention the one-year `NEXT_LOCALE` cookie that remembers a language the visitor picked; a persistent preference cookie is commonly accepted under ePrivacy only when users are informed. The form itself collects name and email, which GDPR covers anyway.
- Contact notifications: save-to-DB only at first; add Resend later?
- Domain name for the Vercel project.
- Should a second admin user ever exist? Affects whether we build user management or seed one account.

Resolved questions move into an ADR in `decisions/`.
