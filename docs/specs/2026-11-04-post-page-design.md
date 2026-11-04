---
tags: [spec, blog, post]
status: dropped
date: 2026-11-04
updated: 2026-11-04
---

# Post Page Design

> **Dropped on 2026-11-04:** the blog was removed from the code by [[2026-11-04-content-in-files]] ([[2026-11-04-content-in-files-design]]). This note records what was built and why.

Status: **done 2026-11-04.** Plan: [[2026-11-04-post-page]], whose "Rulings while building" record the changes made while building (notably `ensureStatic` for a real 404). The second of the two Stage 4 specs (owner, 2026-11-03); the first is [[2026-11-03-blog-list-design]].

Related: [[Post Page Handoff]] (visual contract, with its "Overrides" section), `docs/design/README.md` (site-wide rules), [[Blog Page Handoff]], [[Content Model]], [[Rendering Strategy]], [[ADR-0014 Metadata in the Database]], [[ADR-0007 Testing]], [[Roadmap]].

## Intent

`/[locale]/blog/[slug]` shows one published post. Today every card's title and "Read more" lead to the 404 page. The post is read, not used: the page is fully static, built once per post and locale, and refreshed only when the post is edited.

Success: every published post opens from its card in a new tab, reads as the handoff draws it (with the body limited to what `RichText` renders today), and is described to search engines and link previews by its own title, text and image.

## Scope

**In:**
- The route with `generateStaticParams`, metadata, the page (Back, header, cover, lead text, body, author row), JSON-LD `BlogPosting`.
- `content_full` for the eleven demo posts: one article, the handoff's, cut down to what `RichText` renders.
- Post cards on Home and in the blog list open the post in a new tab.

**Out:**
- **A view counter** (owner, 2026-11-04: no view metrics). `post_views` is gone from the data model.
- **The read time** ("{minutes} min read" in the handoff's meta row; owner, 2026-11-04: not needed).
- New `RichText` marks or nodes: headings, quotes, numbered lists, links, inline code, code blocks with Copy and Shiki. They wait for the Rich text stage ([[Roadmap]]); so does the handoff's code-block Copy button.
- Images inside the body, figure captions (no field holds one), related or next posts (not designed).
- Admin, other locales' content, translating the new UI strings (`messages/en.json` only).

## Decided by the owner

1. **Static with cache tags**, as Home ([[Rendering Strategy]]); no time-based revalidation.
2. **No view counter, no read time.**
3. **Body order:** after the cover, `content_short` in a larger type (the handoff's "lede"), then `content_full` through `RichText`. The first paragraph of `content_full` is not styled as a lede.
4. **`RichText` as it is:** paragraphs, bold, bulleted lists. The demo body is the handoff's article cut down to those (see Data).
5. **Cards open the post in a new tab,** on Home and in the blog list (owner, 2026-11-04, after the "Back loses the filters" question): the list keeps its state in its own tab. "‹ Back" on the post stays a plain link to `/blog` (site rule).
6. **SEO** as proposed: title "<post title> — <site name>", description `content_short`, Open Graph image the cover or the site's placeholder, JSON-LD `BlogPosting`.
7. Project rules over the handoff: the cover goes through `src/shared/ui/Image.tsx`.

## Data

No schema change.

**Demo body.** `content_full` of every demo post (all eleven, the same document) is the article in `docs/design/post/prototype.dc.html`, cut down:
- paragraphs stay paragraphs, with bold where the prototype has it;
- each heading (h2, h3, h4) becomes a paragraph whose whole text is bold (Claude's call: the outline stays readable without heading nodes);
- the bulleted list and the numbered list become bulleted lists;
- the quote becomes a plain paragraph; the code block and its "Copy" line are dropped;
- the prototype's first paragraph ("We moved a large e-commerce store…") is dropped too: on the page the lead is `content_short`.

The seed holds the document (`src/db/seed/data.ts`, built with the existing `doc`/`paragraph` helpers and a bold-text and a bullet-list helper as needed). The live database gets it through a seed step that fills `content_full` where it is `null` (as `seedExperienceDetails` fills fields), confirmed by the owner before the run.

**Read.** `getPost(locale, slug)` in `src/db/queries/blog.ts`: `"use cache"`, `cacheLife("max")`, tags `posts` and `post-topics`; a published post only, `null` otherwise. It returns the card fields of `PostPreview` plus the topic `key` (for the topic link) and `contentFull` (nullable). Localized fields fall back to `en` as on the cards. `getPublishedSlugs()` for `generateStaticParams`, same cache and tags.

## Page

Visual contract: [[Post Page Handoff]] (layout, header, cover, body element styles, end) and the site-wide rules, including `docs/design/post/screens/` and exact values from `prototype.dc.html` and `typography.dc.html`. Only differences and behavior are here.

**Top to bottom:**
1. `BackLink` to `/blog`.
2. `<header>`: `h1`; the meta row: the topic badge, a link to `/blog?topic=<key>` (the blog list's URL function), then `<time>` with the date (no dot and no read time: the dot only separated the two); the tags, links to `/blog?tags=<tag>`, in a container labelled "Tags". These links open in the same tab.
3. The cover `<figure>` through `Image.tsx`, 16:9, wider than the text on desktop; omitted without a cover (every demo post today). No caption.
4. `content_short`: the handoff's lede style (21 px / 1.6 desktop, 18.5 px phone, `foreground`).
5. `content_full` through `RichText` with the handoff's post sizes for paragraphs, bold and bulleted lists (18 / 1.75, `foreground-soft`, 22 px between blocks; round 8 px `brand` markers). Omitted when `null`. How `RichText` takes the post sizes (a prop, a variant, a wrapper class) is left to the builder; Home, About and Projects must not change.
6. The end: the rule, then the author row: an avatar circle with the initials (`getInitials`), the name and the job title from `profile` (Claude's call: the data the About page and the hero already use, not the handoff's `Post.authorRole` message).

**Not found:** an unknown slug and a draft render the site's 404 (`notFound()`). The slug is checked against the cached `getPublishedSlugs()` before `getPost` runs, so an arbitrary URL adds no `"use cache"` entry (the blog list's rule). Corrected after the final review: the route still stores its rendered 404 for every requested path, see [[2026-11-04-post-page]]. `generateStaticParams` must not return an empty list, which fails the build under Cache Components: with no published post it returns one placeholder slug that renders the 404 (Claude's call after the builder check).

**Cards** (`PostCard`, Home and the blog list): the title link (list) and "Read more" (both) get `target="_blank"` and `rel="noopener"` and a visually hidden "(opens in a new tab)" (Claude's call, WCAG technique G201: the visitor is told before a new window opens). On "Read more" the `aria-hidden` ↗ icon replaces today's → arrow, so the look says it too; the title gets no icon, so the heading keeps its look (Claude's calls after the builder check). Tag links on cards stay in the same tab. `NavigationScope` already leaves links with a `target` to the browser.

**Rendering:** `generateStaticParams` returns every published slug for every locale; the page and its metadata read only cached functions, so each post is prerendered (`○` or `●` in the build, no `◐`). A post published after the build renders on its first request and is cached.

**Metadata** (`src/views/post/metadata.ts`): title `<post title> — <site name>` (site name from `meta_site_settings_translations`), description `content_short`, Open Graph image the cover, else the site's placeholder (as the other pages through `buildPageMetadata`), `og:type` `article` if the builder's metadata helper allows it without changing other pages. Canonical and alternates are `/blog/<slug>` per locale. No `meta_pages` row: a post's metadata is the post.

**JSON-LD** `BlogPosting` (as About's `Person`, through `serializeJsonLd`): `headline`, `datePublished`, `author` (`Person` with the profile's name and URL of the site), `image` when there is a cover, `keywords` from the tags, `inLanguage` the locale, `mainEntityOfPage` the canonical URL.

**Messages (`messages/en.json`):** a `Post` namespace with `tags` from the handoff's; `readTime`, `copyCode`, `copied` and `authorRole` are not used now. `Common` gains `newTab` "(opens in a new tab)". `back` comes from `Common`.

**Structure** (adapted FSD; the builder may refine):
- `src/app/[locale]/blog/[slug]/page.tsx`: the route, re-exports the view, `generateMetadata` and `generateStaticParams`, with the one-line rendering comment.
- `src/views/post/PostPage.tsx`, `src/views/post/metadata.ts`.
- A widget for the article.

## Tests

[[ADR-0007 Testing]]. Nothing here writes to the database except the seed step, which the owner confirms.

- **Vitest:** the article's pure or client parts, if any; `PostCard` (`target`, `rel` and the hidden text on the title and "Read more", the ↗ icon on "Read more" only, tags without a target).
- **Playwright** against the production build:
  - a card on Home and one in the blog list open the post in a new page (`context.waitForEvent("page")`), the list tab keeps its URL;
  - the post: Back to `/en/blog`, the `h1`, the topic link and the tag links with their list URLs, the date and no read time, no figure without a cover, the lead text, the body's paragraphs and list, the author row;
  - an unknown slug gives the 404 page. A draft is not tested end to end: the database holds none, and a test must not add one to production data; drafts are excluded by the same `status = 'published'` condition as every list read (Claude's call after the builder check);
  - metadata: title, description, `og:image`, canonical `/en/blog/<slug>`, hreflang; JSON-LD parses and holds the headline and the date;
  - the layout at 360 px (no horizontal scroll) and at desktop width (the 760 px column);
  - the build lists the post route as prerendered.
- Definition of done for every step: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Documents to update when the page is done

- [[Roadmap]]: Stage 4 done.
- [[Rendering Strategy]]: the post row as built.
- [[Post Page Handoff]]: point its "Overrides" to this spec.
- [[Blog Page Handoff]] and [[Home Page Handoff]]: the cards' new-tab links.

## Left to the builder

- Exact sizes, gaps and colors from the handoff, the prototype and the typography board.
- How `RichText` takes the post sizes.
- The exact demo document, within the rules in Data.
- Step order inside the plan.
