---
tags: [plan, i18n, testing]
status: done
date: 2026-11-11
---

# Plan: Content translations

Move the e2e suite onto frozen test content, then translate the content into `ru`, `pt`, `es`, `de`, `fr`, `ja`, `pl`. The checklist in this note is the ledger: a task is ticked when its delta is staged.

**Goal:** content in eight languages, and a test suite that no content edit can fail.

**Architecture:** `contentRoot` comes from `CONTENT_ROOT` when it is set; Playwright builds the site from `e2e/content/` (the English content of `4b250f8`, the suite's last green state). Translations are partial locale files merged field by field with English (`mergeFields`), as the Content Model defines.

**Tech stack:** Next 16 (Cache Components), next-intl 4, Vitest, Playwright, YAML 1.2 frontmatter.

**Spec:** [[2026-11-11-content-translations-design]] (read it with this plan).

Related: [[Content Model]], [[Localization]], [[ADR-0007 Testing]].

## Global constraints

- **Stages, not commits.** Every task ends with `git add` of its whole delta. The owner commits; the commit question (and the version) comes once, after Task 4.
- **Inline, one task at a time**, explained in Russian in the chat.
- **Definition of done for a task:** `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- **No comments in code**, named exports, no barrels, English in the repository.
- **No test reads `messages/**/*.md`** after Task 1 (owner, 2026-11-11). No test of the translations.
- **Locale files hold translated fields only**; the field table, the owner's decisions 1–6 and the translation rules are in the spec.
- **Test images in Blob:** the fixtures use copies the tests own, `e2e/photo.jpg` (the current photo) and `e2e/cover-glovo.png` (the current Glovo cover), under `https://5iyco5bcxydlbyja.public.blob.vercel-storage.com/`. The owner uploads them (Claude has no Blob credentials); until then Task 1 cannot finish.

## Review focus

- A server on port 3100 started outside Playwright (`npm start` with the real content) is reused by `reuseExistingServer` and fails the suite; the e2e run starts with the port free.
- `CONTENT_ROOT` relative to the working directory: Playwright runs from the repository root, so `e2e/content` resolves there; `path.resolve` makes the root absolute before the getters cache it.
- `outputFileTracingIncludes` traces `./messages/**/*.md` only: the e2e server runs from the repository, not from a trace, so the fixtures need no tracing.
- A fixture image of another size (the new cover is 2400 × 800, the old one was 1600 × 903): tests that compute the expected file width from the rendered box must still hold.
- A translated YAML value with `: ` or a leading `«`, `[`, `*`, `"` must be quoted, or the build fails on parse.

## Tasks

- [x] Task 1: Test content fixtures
- [x] Task 2: Russian content
- [x] Task 3: Content in pt, es, de, fr, ja, pl
- [x] Task 4: Checks and documentation

### Task 1: Test content fixtures

**Files:**
- Modify: `src/content/read.ts`, `src/content/read.test.ts`, `playwright.config.ts`, `e2e/meta-content.ts`
- Create: `e2e/content/en/**` (12 files), `docs/decisions/ADR-0017 Test Content Fixtures.md`
- Modify: `docs/decisions/ADR-0007 Testing.md`

**Interfaces:**
- Produces: `resolveContentRoot(configured: string | undefined, cwd: string): string` in `src/content/read.ts`; `contentRoot = resolveContentRoot(process.env.CONTENT_ROOT, process.cwd())`.

- [x] **Step 1:** In `read.test.ts`, a `describe("resolveContentRoot")` with two cases: `resolveContentRoot(undefined, "/repo")` is `"/repo/messages"`; `resolveContentRoot("e2e/content", "/repo")` is `"/repo/e2e/content"`; an empty string counts as unset (`"/repo/messages"`).
- [x] **Step 2:** `npx vitest run src/content/read.test.ts` → FAIL (`resolveContentRoot` is not exported).
- [x] **Step 3:** Implement it with `path.resolve(cwd, configured)` when `configured` is non-empty, else `path.join(cwd, "messages")`; derive `contentRoot` from it.
- [x] **Step 4:** Same command → PASS.
- [x] **Step 5:** `git archive 4b250f8 messages/en | tar -x` into a temporary folder and copy every `.md` of `messages/en/` to `e2e/content/en/` unchanged, except two URLs: `photoUrl` in `profile.md` → `…/e2e/photo.jpg`, `imageUrl` in `experience/glovo.md` → `…/e2e/cover-glovo.png`. `curl -sI` both: 200.
- [x] **Step 6:** `playwright.config.ts`: `CONTENT_ROOT: "e2e/content"` in `webServer.env`. `e2e/meta-content.ts`: read `e2e/content/<locale>/meta.md`. `grep -rn "messages/" e2e` lists only `e2e/messages.ts` (JSON).
- [x] **Step 7:** `npm run test:e2e` → 499 passed, 0 failed (as at `4b250f8`). A failure from the new cover's size is fixed in the test's arithmetic, not by changing the fixture.
- [x] **Step 8:** The proof: delete `messages/en/about/who.md`, rename `messages/en/experience/glovo.md` to `acme.md`; `npm run test:run` and `npm run test:e2e` → green; `git checkout messages` restores them.
- [x] **Step 9:** ADR-0017 from the template (context, decision, alternatives B and C of the chat, consequences: the fixtures are frozen, the two Blob copies, build validation still guards real content). ADR-0007: the consequence on content now points to ADR-0017.
- [x] **Step 10:** Definition of done. `git add src/content/read.ts src/content/read.test.ts playwright.config.ts e2e docs/decisions`; tick Task 1.

**Task 1 notes:**
- `resolveContentRoot`: three cases RED (`resolveContentRoot is not a function`), then GREEN, 15 of 15 in `read.test.ts`.
- `e2e/content/en/` differs from `4b250f8` in the two image URLs only (`git diff --no-index`).
- The first full run failed 278 tests on one cause: the Blob copies were not reachable yet (404, a console error on every page with the photo). With the copies in place: 498 passed and the known flaky "recomputes the bars when the phone turns" ([[Open Questions]], since 2026-11-04) failed; 8 of 10 alone. Not caused by the fixtures (the image box has a fixed height); left as it is.
- Proof: with `messages/en/about/who.md` deleted and `experience/glovo.md` renamed to `acme.md`, 419 of 419 unit tests and 499 of 499 e2e tests passed; the content was restored.
- Ruling: the build of the definition of done ran with the Russian drafts of Task 2 moved aside, so Task 1 was checked on its own delta.

### Task 2: Russian content

**Files:** Create `messages/ru/meta.md`, `messages/ru/profile.md`, `messages/ru/about/{who,motivation,skills,scale,next}.md`, `messages/ru/experience/{glovo,sony,freshdirect}.md`.

- [x] **Step 1:** Write the ten files: fields per the spec's table, decisions 2, 3, 4, 6. `name: Михаил Александров`; `jobTitle` and the senior `role`s «Senior Frontend-разработчик», FreshDirect's «Frontend-разработчик»; `cvUrl` of the Russian CV with `?download=1`; `siteName` and `defaultTitle` «Михаил Александров»; questions with «вы».
- [x] **Step 2:** `npm run build` → passes (schemas, links). `npm start` on a free port, open `/ru`, `/ru/about`, `/ru/experience`, `/ru/skills`: Russian text, English skills, the Russian CV link.
- [x] **Step 3:** Definition of done (the suite does not see `messages/ru`).
- [x] **Step 4:** `git add messages/ru`; tick Task 2.

**Task 2 notes:**
- Build with `messages/ru` passed. On the production server: Russian `<title>` and headings on all four pages, «Михаил Александров» in every title, the CV link `…_RU.pdf?download=1`, `/ru/experience#freshdirect`, both roles.
- Definition of done: 419 unit tests, 499 e2e tests, lint, type check.

### Task 3: Content in pt, es, de, fr, ja, pl

**Files:** for each locale, the same ten files as Task 2.

- [x] **Step 1:** Write the six locales: the name and the title stay English (left out), decision 4's address form, the variants and number typography of the spec.
- [x] **Step 2:** `npm run build` → passes.
- [x] **Step 3:** Definition of done.
- [x] **Step 4:** `git add messages`; tick Task 3.

**Task 3 notes:**
- Build with all eight locales passed; on the production server every locale's titles, headings and questions are translated, the name and the title are English, the CV is the English one.
- A one-off comparison with English: the same numbers, links, list items, bold labels and hard breaks in every file; Japanese alone writes small counts as digits (`3倍`, `4人`, `6か月`), as the language does.
- Ruling: Polish one-letter words bound with a no-break space (166 places), after the screenshots showed `i` and `w` at line ends. Cost if wrong: a typographic preference, reversible with one replace.

### Task 4: Checks and documentation

- [x] **Step 1:** A throwaway Playwright script in the scratchpad (not committed): every locale × `/`, `/about`, `/experience`, `/skills` at 320 and 390 px on the production server; `document.documentElement.scrollWidth <= innerWidth`. Screenshots of `de` and `pl` About checked by eye. Any overflow is reported to the owner before a fix.
- [x] **Step 2:** A reread of each language against English: facts, numbers, links, bold labels.
- [x] **Step 3:** Documentation: [[Content Model]] (fixtures, `CONTENT_ROOT`), [[Localization]] (content translated, the name and title rules), [[Open Questions]] (the Russian CV is set: its `hreflang` note stays), [[Roadmap]], `docs/Home.md` (spec, plan, ADR-0017), the journal of 2026-11-11, the spec and this plan to `done`.
- [x] **Step 4:** Definition of done. `git add docs`; tick Task 4. Ask the owner about the commit and the version.

**Task 4 notes:**
- No horizontal scroll: 8 locales × 4 pages × 320 and 390 px, 64 checks, before and after the Polish fix; German and Polish About checked on screenshots.
- Definition of done: 419 unit tests, 499 e2e tests, lint, type check, build with all eight locales.

**After Task 4 (owner):** the domain labels of `skills.md` translated in the seven locales (`domains` only, merged by `key`). The chips fit the filter column at 1024 px in every locale after German "Frameworks & State-Management" was shortened to "Frameworks & State"; no horizontal scroll at 320 px.

**After the plan (owner's content edits):** the skill lists of `about/skills.md` synced with English in the six locales; missing hard breaks and two unclosed bold labels in `en` and `ru` fixed; the new sentence of `profile.md` and `about/who.md` translated; the Russian sentence got its comma and "pull request" in Latin. Definition of done green after each change.
