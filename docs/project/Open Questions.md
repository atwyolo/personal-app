---
tags: [project]
updated: 2026-11-02
---

# Open Questions

- The About and Skills pages have handoffs in `docs/design/` and items in the navigation, but no stage in [[Roadmap]]. Which stage takes them?
- Blog authoring: everything through the admin editor, or allow importing Markdown? (Default: editor only.)
- Media: the Blob store exists since 2026-10-30 (files uploaded by hand in the dashboard). Does the admin in Stage 6 need an upload form, or are pasted URLs enough at first?
- Privacy notice (by Stage 5, contact form): mention the one-year `NEXT_LOCALE` cookie that remembers a language the visitor picked; a persistent preference cookie is commonly accepted under ePrivacy only when users are informed. The form itself collects name and email, which GDPR covers anyway.
- Contact notifications: save-to-DB only at first; add Resend later?
- Domain name for the Vercel project.
- Should a second admin user ever exist? Affects whether we build user management or seed one account.

Resolved questions move into an ADR in `decisions/`.
