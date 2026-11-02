---
tags: [plan, home]
status: done
date: 2026-10-30
updated: 2026-11-02
---

# Plan: Home motion and verification pass

Run the accent wipe once on every block when the page opens, then run the checks the spec postponed. This closed the home page on 2026-11-02.

Related: [[2026-10-29-home-page-design]] ("Rendering, SEO and animation", "Verification to include in the plan"), [[Home Page Handoff]]. Previous: [[2026-10-30-home-blog]].

## Decisions

- **One wipe on load, all at once (owner's decision, 2026-11-01).** This replaces the design's stagger and its scroll-driven reveal, which looked risky. Every block plays `wipe` for 0.7 s with `cubic-bezier(0.75, 0, 0.2, 1)` after 150 ms. `--i`, `view()` and `@supports` are gone, so there is no frozen shutter on a large screen and no fallback path. Blocks below the fold finish out of sight.
- **Once per page load, a reload plays it again (owner's decision, 2026-11-01).** Links, the back button and a language switch do not. `cacheComponents` hides a left route with `display: none`, and showing it restarts a CSS animation, so CSS alone cannot do this. The client leaf `shared/ui/RevealOnce.tsx` waits for the wipes to end and sets `data-revealed` on `<html>`, and the shutter rule requires that attribute to be absent. A language switch remounts the root layout and clears the attributes of `<html>` without a full load, so the leaf keeps a module variable and sets the attribute again in a layout effect, before the paint. JavaScript only switches the decoration off and never hides content: without it the wipe plays on each load. A reload is the only way back: `sessionStorage` would survive it, and telling a reload from a first visit before the paint needs an inline script.
- **What wipes (owner's decisions):** the header, Hero, the photo, each contact button, About, each Experience card, the Skills tile, each post card. Section headers, pills and carousel controls do not.
- **The same on every width** (Claude's call). With one DOM the cards wipe one by one on phones too, so `Carousel` needs no wrapper and its track stays untouched.
- **Two classes** (Claude's call): `.reveal` and `.reveal-left`, passed through `className`. This replaces the helper approved earlier: without `--i` there is nothing to compute.
- **Directions alternate** (Claude's call), as in the design: `.reveal` slides off to the right, `.reveal-left` to the left. Fixed in the markup for single blocks, `index % 2` for cards. The header slides left, opposite the Hero under it.
- **`overflow: clip`, not `hidden` (approved by the owner, 2026-11-01).** A time-based wipe works with either, but `hidden` makes every block a scroll container for no reason. It would also break a future `view()` reveal: measured in Chromium 156 and WebKit 27.2, with `hidden` the shutter stays at 0 at every scroll position, with `clip` it goes 1, 0.96, 0.33, 0 as the block enters. `tokens.css` and the prototype both have `hidden`.
- **The photo stays under the shutter (owner's decision, 2026-11-01).** It is fully visible at 850 ms. LCP cannot show this: a test page in Chromium reported 8 ms with and without the shutter.
- **i18n messages stay whole unless the numbers change.** Measured 2026-10-30: all messages are 808 bytes gzipped, those used by client components 340 bytes, about 580 with Skills and the Carousel. Task 2 measures again.

## Tasks

### Task 1: The wipe on every block (M)

`src/app/globals.css`, the blocks above, `shared/ui/RevealOnce.tsx`, `e2e/home-motion.spec.ts`, [[Home Page Handoff]].

- [x] The rules are in `globals.css`. With reduced motion blocks are simply visible.
- [x] The blocks from the decisions carry `.reveal`, and all of them start together. `Carousel` and its slides carry nothing.
- [x] Directions alternate.
- [x] The wipe plays once per page load: a link, the back button and a language switch do not start it, a reload does.
- [x] The header wipes too and stays sticky.
- [x] No layout shift, the header stays above the shutter, clicks pass through it.
- [x] [[Home Page Handoff]] and the spec record the deviations from the design.

Verify: `e2e/home-motion.spec.ts`, screenshots in both themes. Depends on: nothing.

### Task 2: Verification (M)

- [x] Lighthouse on the production build. LCP does not see the shutter, so the time the photo is fully open is recorded as well.
- [x] Client JS with and without an adapter on the same component.
- [x] Message payload measured again; narrow it with `pick` only if it became a noticeable share of the page.
- [x] Playwright mobile project fails on hydration errors (already true through `e2e/fixtures.ts`; confirm it covers the new client leaves).
- [x] Handoff accessibility checklist: touch targets, focus ring, labels, contrast. Contrast runs after the wipe: `axe-core` counts an opaque `::after` over the text and ignores its `transform`.
- [x] iOS simulator: the wipe plays, swipes and rotation still work.

Verify: numbers recorded in the spec and the journal. Depends on: Task 1.

**Results (2026-11-01, production build on localhost, median of three Lighthouse 13.6 runs):**

| | Mobile | Desktop |
|---|---|---|
| Performance | 95 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 788 ms | 211 ms |
| LCP | 2987 ms | 622 ms |
| TBT | 3 ms | 0 ms |
| CLS | 0 | 0 |

- **SEO:** a run on a port other than the build's reports 92, because the canonical URL carries the port. A build for that port gives 100, so this is a local artifact.
- **LCP:** the mobile figure is Lighthouse's simulation. A hundred needs about 1850 ms there. With real throttling (`--throttling-method=devtools`) the page scored 99 with an LCP of 1636 ms, and Chromium on Slow 4G with a 4× slower CPU reports 760 ms. The local server speaks HTTP/1.1. Repeat Lighthouse on Vercel, where HTTP/2, the CDN and the image optimizer are real.
- **`inlineCss` locally:** FCP went from 904 to 788 ms in every run and LCP stayed within the noise of the simulation, while the HTML grew from 17.2 to 39.3 KB gzip, because the CSS is sent twice, in `<style>` and in the RSC payload. That looked like a bad trade and was turned off; Vercel showed otherwise, see below.
- **Base UI out of the first load** was tried and rejected: 53 KB less JS, LCP 2910 ms, Performance 95, within the same noise.
- **The photo is fully visible** at 890 ms, and at 1610 ms on Slow 4G with the slower CPU.
- **Client JS on `/en`:** 225.6 KB gzip in 9 files: React DOM 70, Base UI with the icons about 87, the Next runtime about 45. The own code of every module in `shared/ui` is about 5 KB, 2.2% of it, so the adapters add no meaningful weight. Measured with esbuild instead of the interactive `next analyze`: an adapter's own code is exactly the difference, because the shadcn component under it ships either way.
- **Messages:** 727 bytes gzip in total, 411 used by client components. `pick` would save 316 bytes of the HTML, so messages stay whole.
- **Hydration:** a deliberate mismatch in `RevealOnce` failed the suite with React error #418, so the fixture covers the new leaf.
- **Accessibility:** axe in `en` and `ru`, both themes, 390 and 1280 px: no violations. The WhatsApp button moved from the official `#25d366` (1.98:1) to `#188842` with the same hue, 4.53:1 with white (owner's decision, 2026-11-01). Buttons and carousel arrows are at least 44 px; the handoff does not ask that of text links, the smallest being the desktop navigation at 23 px high with 28 px between items. The keyboard order is logical, and no ring is clipped or hidden under the sticky header.

**On Vercel (2026-11-01, `/en`, commit `d4dee13`, HTTP/2 and Brotli, median of three runs from a local Chromium):**

| | Mobile | Desktop |
|---|---|---|
| Performance | 96 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 1012 ms | 301 ms |
| LCP, simulated | 2618 ms | 527 ms |
| TBT | 20 ms | 0 ms |
| CLS | 0 | 0 |

- Runs differ by under 40 ms in LCP, far less than on the local server, so one deployment can be compared with another.
- `/ru` gives 97; `/` gives 96 and adds a 307 redirect to the locale.
- With real throttling mobile is 99 with an LCP of 2143 ms. The photo waits behind the fonts: 18 KB take 1453 ms, because three preloaded fonts of 67 KB share the connection at the same High priority.
- Without throttling Chromium reports an LCP of 264 to 332 ms. Lighthouse's own run records its first paint at 1316 ms, which is an artifact of that run: the file arrives at 285 ms.

**After these numbers (owner's decision, 2026-11-01):** only the Latin file of Geist is preloaded. `subsets: ["latin"]` drops the Cyrillic file from the preloads, 15 KB, and `preload: false` drops Geist Mono, 23 KB, so the photo no longer shares the connection with them. Other glyphs still load on demand through `unicode-range`, and fonts use `font-display: swap`. `inlineCss` went off in the same step, but that change was lost in a merge, so the deployment below measures the fonts alone.

**On Vercel after the font change (2026-11-01, `/en`, `inlineCss` still on, median of three):** mobile 98, 100, 100, 100; desktop 100 on all four. Against the deployment above:

| Mobile | Before | After |
|---|---|---|
| Performance | 96 | 98 |
| LCP, simulated | 2618 ms | 2444 ms |
| LCP, real throttling | 2143 ms | 1978 ms |
| Speed Index | 2792 ms | 1373 ms |
| CLS | 0 | 0.0006 |

`/ru` scattered between 96 and 100. The photo still takes 1247 ms under real throttling, next to the HTML of 31 KB and the one remaining preloaded font of 29 KB. A hundred on mobile needs a simulated LCP of about 1850 ms.

**On Vercel with `inlineCss` off:** mobile 97, and with real throttling FCP doubled from 921 to 1862 ms, while LCP stayed at about 2070 ms and the document fell from 31 to 16 KB. `inlineCss` is back on (owner's decision, 2026-11-01), see [[ADR-0011 Inline CSS]].

**Where this stops (owner's decision, 2026-11-01):** mobile 98, with an LCP of about 0.3 s without throttling. A hundred needs a simulated LCP of about 1850 ms. The last candidate, no preload for the Latin file of Geist, would swap the Hero title visibly on a slow connection, and the gap between 98 and 100 lives only in the simulation.

**Fixed by this task:** one 3 px ring in the solid `ring` color on every link and button, where the site had three kinds, two of them weak; buttons keep an outline in forced colors mode, where the browser drops box shadows; the visible text is now part of the accessible name of the language button and the CV link; the photo is fetched with `fetchPriority="high"`. That raises its priority from Low to High and passes the Lighthouse check, but Lighthouse's LCP did not change (2985 and 3061 ms are noise).

**iOS simulator (2026-11-02, iPhone 17, iOS 26.5, production build through a measuring proxy, nine runs, 0 errors):**

| Check | Result |
|---|---|
| Wipe on load, `/en` three times, `/ru` dark | 16 of 16 animations start and end, about 700 ms, then `data-revealed` |
| Swipes in portrait | stop exactly on 382, 764 and 1146, the counter follows |
| Overscroll on the last slide | bounces to 1259, back on 1146, the counter stays `4 / 4` |
| Rotation both ways, Experience and Blog | the slide survives, no horizontal overflow, the wipe does not restart |
| Swipes in landscape | a step of 700, both ways; a swipe under half a slide snaps back |
| A vertical swipe that starts on a carousel | the page scrolls by 248 px and back, the carousel does not move |

Control run with a `ResizeObserver` that never fires: on the way back to portrait the carousel moved from slide 3 to slide 4. With the fix it stays on 3, so the check can fail. Links, the back button, a language switch and reduced motion on iOS were not run; `e2e/home-motion.spec.ts` covers them in Chromium. Timing in a simulator is not the timing of a phone.

### Task 3: The sliding navigation indicator (S)

The owner's request of 2026-11-02: the highlight of the desktop navigation slides from one item to the next instead of jumping, and a browser without the feature keeps today's underline. CSS Anchor Positioning, see [[ADR-0012 Nav Indicator]]. Firefox shows the bar without the slide (owner's decision, 2026-11-02).

`src/app/globals.css`, `shared/ui/NavLink.tsx`, `widgets/header/Header.tsx`, `e2e/header-nav.spec.ts`.

- [x] One server-rendered indicator in the desktop `nav`, anchored to the link with `aria-current="page"`.
- [x] It slides and takes the width of the new item, and a click in the middle turns it around from where it is.
- [x] Items keep their place: the width of the semibold label is reserved in each of them.
- [x] With reduced motion it moves at once; without a current item it is hidden.
- [x] Without anchor positioning nothing changes: the underline stays on the link. All the behavior is inside `@supports`; outside there is only the rule that hides the bar.
- [x] The bar leaves the focus ring whole and stays visible in forced colors mode.
- [x] The mobile menu keeps the underline.

Verify: `e2e/header-nav.spec.ts`, Safari 26.5 on the iPad simulator. Depends on: nothing.

### Task 4: The whole selected menu item in the accent color (S)

The owner's request of 2026-11-02: the code of the selected locale keeps the muted color. The same rule breaks the selected item under the pointer or the keyboard focus, where shadcn's `focus:**:text-accent-foreground` repaints the label and the check.

`shared/ui/Menu.tsx`, `e2e/header-menus.spec.ts`.

- [x] The label, the hint and the check of the selected item use `text-brand`, focused or not.
- [x] Other items keep the muted hint.
- [x] The hint of the selected System item in the theme menu follows the same rule (Claude's call).
- [x] The hint of the selected item stays at 4.5:1 or more under the pointer, in both themes.

Verify: `e2e/header-menus.spec.ts`. Depends on: nothing.

### Task 5: Contact buttons in theme colors (S)

The design of 2026-11-02: WhatsApp, Mail and LinkedIn become identical cards with `brand` icons, Download CV stays filled. This replaces the brand colors, the logos and the `#188842` of 2026-11-01.

`widgets/contacts`, `src/app/globals.css`, `e2e/home-contacts.spec.ts`, [[Home Page Handoff]].

- [x] Cards in `bg-card` with a 1 px `card-border`, a 26 px outline icon in a 36 px box, an 18 px arrow.
- [x] Hover: the `brand` border and nothing else. The design's lift, shadow and arrow nudge were built and removed (owner's decision, 2026-11-02).
- [x] The site's one 3 px focus ring stays, not the design's 2 px outline (Claude's call).
- [x] The design's glyphs replace the real logos of 2026-10-30, in `ContactIcons.tsx`, because the owner asked to follow the design; the brand tokens are gone.
- [x] The address takes the prototype's 15 px from `lg`: one line in a 288 px column, wrapped at the dots below that.

Verify: `e2e/home-contacts.spec.ts`, screenshots at 390, 1024, 1100, 1280 and 1440 px. Depends on: nothing.

## Checkpoint

- [x] Definition of done from `CLAUDE.md` is green (2026-11-02: 125 unit, 288 e2e).
- [x] Lighthouse repeated on Vercel after the font change.
- [x] Spec status changes from draft, and [[Roadmap]] is updated.

## Deferred (from Tasks 3 and 4)

- How long the bar waits on a real network: it starts when the route commits, and only localhost was measured. Check it after a deployment.
- The focus ring over the bar was measured in Chromium only: focus did not land in Playwright WebKit. Forced colors mode is Chromium only too.

## Deferred (from the review of Task 1)

- Contact directions are fixed per contact. Without one contact two neighbours share a direction, and the alternation test fails.
- The tests do not read the shutter's color or size; screenshots cover them.
- A language switch in the middle of the wipe has no e2e test; by reading the code the mark still lands before the paint.
- The 1 px `card-border` stays visible over the shutter: `clip` cuts at the padding box, as `hidden` does in `tokens.css`.
- `overflow: clip` cuts a long unbroken word in a card title instead of letting it overflow. Check it when translated titles exist; `[overflow-wrap:anywhere]` on the title is the fix.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| The photo is covered for 850 ms and no metric shows it | Medium, accepted by the owner | The time is recorded in Task 2 |
| `overflow: clip` on a block clips a focus ring inside it | Medium | Keyboard pass in Task 2 |
