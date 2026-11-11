---
tags: [adr, testing, content]
status: accepted
date: 2026-11-11
---

# ADR-0017 Test Content Fixtures

Amends [[ADR-0007 Testing]], whose e2e tests compared pages with the content files in `messages/`.

## Context
The e2e suite ran against a build of the real content. Its specs held the slugs, names, roles, counts and the phone number of the content they were written against, and `e2e/meta-content.ts` read `messages/en/meta.md`. When the owner filled the English content (commit `d71b7f6`), 133 of 499 e2e tests failed without a line of code changing. Many of them test behaviour, not text: reading progress, deep links, the carousel and the question chips need two or more jobs, a job without an image, a known order. The owner's rule (2026-11-11): tests do not test the content, and editing the content never fails a test.

## Decision
- `contentRoot` (`src/content/read.ts`) is `CONTENT_ROOT` resolved against the working directory when that variable is set, else `messages/`. Production never sets it.
- Playwright builds and serves the site with `CONTENT_ROOT=e2e/content`. `e2e/content/en/` is the English content of commit `4b250f8`, the suite's last green state, with two image URLs changed to copies the tests own in Blob: `e2e/photo.jpg` and `e2e/cover-glovo.png`.
- No test reads `messages/**/*.md`. `e2e/meta-content.ts` reads the fixtures; the tests that compare a page with "the content files" compare it with the fixtures and check that frontmatter reaches the page.
- The fixtures are frozen: they change only together with a test that needs a new property of the data.

## Alternatives
- **Delete every test that depends on the data.** Fewer changes, but most of the interactive behaviour would lose its tests along with the content checks.
- **Let the tests read the real content and adapt,** skipping a check when the data lacks what it needs (no job without an image). A test that skips itself on the data says nothing about whether it checked anything.

## Consequences
- Adding, removing, renaming or rewording content in `messages/` cannot fail `npm run test:run` or `npm run test:e2e`. Shown on 2026-11-11 by deleting `about/who.md` and renaming `experience/glovo.md` with the suite green.
- Broken content still fails `npm run build`: the Zod schemas, the link check in Markdown, "no English counterpart" and "a skill of a job must be in `skills.md`" validate the real content on every build. That guards the deploy and is not a test.
- `e2e/messages.ts` still reads `messages/<locale>.json`: interface strings are not content.
- The e2e build prerenders the fixtures into `.next`. Playwright reuses a server already listening on port 3100 (`reuseExistingServer`), so a server started by hand with the real content would be tested instead.
- The two Blob files under `e2e/` belong to the tests: replacing the production photo or cover does not touch them, and deleting them fails the image tests.
