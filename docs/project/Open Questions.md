---
tags: [project]
updated: 2026-11-11
---

# Open Questions

- `hreflang` on the CV link: the link could say the file's language (`hreflang="en"` everywhere but `ru`, which has its own Russian CV since 2026-11-11). The loader would need to know it: a locale's own `cvUrl` in `messages/<locale>/profile.md` means the locale's language, otherwise English (found 2026-11-10).

Closed on 2026-11-04 by [[ADR-0015 Content in Files]] (no admin, no database, no contact form): the admin's metadata section, drafts of About pairs, the separate `projects` list, an upload form, contact notifications, a second admin user.

Closed on 2026-11-11/12 by [[2026-11-11-launch-polish]]: the privacy notice (a session cookie needs none, [[ADR-0020 Session Locale Cookie]]), the domain (`www.mikhail-aleksandrov.com` is connected), the empty `/favicon.ico` (it serves the icon's bytes now), the flaky "phone turns" test (its oracle ignored the page-end rule).

Resolved questions move into an ADR in `decisions/`.
