---
tags: [design, handoff, blog, post]
status: approved
updated: 2026-11-02
---

# Post Page Handoff

`/[locale]/blog/[slug]` shows one blog post: Back link, title, topic and date, tags, cover image, then the article body.

See [[README]] for shared rules and files. Data: posts in `shared/content.ts` (`PostPreview` plus a rich-text body). Messages: the `Post` and `Common` namespaces.

## Files

| File | What it is |
|---|---|
| `post/screens/` | The page with a real demo article. Files 1–5 are dark at scroll positions top to bottom; `*-light-1` is the light theme. |
| `post/prototype.dc.html` | The page prototype source (exact values). |
| `post/screens-typography/`, `post/typography.dc.html` | **Typography reference.** The same page, where every element a post can contain is labelled with its size / line height · weight · color token. Use this board to build the shared `<RichText>` styles. |

## Scope and order

1. Route `blog/[slug]` with `generateStaticParams`, ISR, `generateMetadata` (title, description = excerpt, Open Graph image = cover), and `notFound()` for unknown slugs.
2. Header block: Back, h1, meta row, tags.
3. Cover with `next/image`.
4. `<RichText>` with all element styles (shared with Home About, About answers and Projects).
5. The copy button for code blocks (a small client component).
6. JSON-LD `BlogPosting`.

## Layout

- Article column: `max-width: 760px`, centered, padding 28 × 40 × 72 px on desktop and 18 × 18 × 48 px on phone. No sidebar, no footer.
- **Back** link first, pointing to `/[locale]/blog`. Style in [[README]].
- **Header** (`<header>`, flex column, gap 14 px, 22 px below Back):
  - **h1**: 44 px / 1.1 / 700, tracking −.035em (30 px on phone).
  - **Meta row** (gap 12 px, wraps):
    - the topic badge, a link to `/blog?topic=<id>`: mono 11 px uppercase, letter-spacing .08em, `brand` text on `brand` at 14%, padding 6 × 9 px, radius 6 px;
    - `<time>` with the date (mono 13 px, `muted-foreground`, next-intl `format.dateTime`);
    - a 4 px dot in `border`;
    - the read time "{minutes} min read" (same style). Compute it from the word count at about 200 words per minute.
  - **Tags**: chips that link to `/blog?tags=<tag>`. Mono 12 px, padding 8 × 11 px, a pill with a `card-border` outline and `brand` text. On hover they are filled with `brand`.
- **Cover** `<figure>`: 16:9, radius 24 px, 28 px below the header.
  - On desktop it is **wider than the text** (negative side margins of 40 px); on phone it is full column width with radius 18 px.
  - Optional `<figcaption>`: 13 px, `muted-foreground`, centered, 10 px above.
  - Without a cover the figure is omitted.
- **Body**: 34 px below the cover (26 px on phone). Element styles are below.
- **End**: a 1 px `card-border` rule (44 px above, 22 px below), then the author row: a 48 px avatar circle (initials "MA" in `brand` mono on `card`), the name in 16 px / 600 and the role in 14 px `muted-foreground`.

## Body elements (`<RichText>`, post size)

| Element | Desktop | Phone | Notes |
|---|---|---|---|
| Lede (first paragraph) | 21 / 1.6, `foreground` | 18.5 | Apply to the first `<p>` automatically. |
| Paragraph | 18 / 1.75, `foreground-soft` | 16.5 / 1.7 | 22 px between blocks, no indentation. |
| h2 | 28 / 1.2 / 700, −.02em, 44 px above | 23, 36 px above | |
| h3 | 22 / 1.25 / 700, 36 px above | 20 | |
| h4 | 18 / 1.3 / 700, 28 px above | 17 | |
| Bold | 700, `foreground` | | |
| Italic | italic, `foreground` | | |
| Underline | 2 px `deco` line, offset 4 px | | Use sparingly; must not look like a link. |
| Link | `brand`, 2 px `deco` underline, offset 4 px | | External links: `target="_blank" rel="noopener"`. |
| Inline code | mono .86em, padding 3 × 6 px, radius 6, `bg-card`, 1 px `card-border` | | |
| Code block | mono 14 / 1.65, panel `#0B0F22`, radius 16, border `card-border` | 12.5, scrolls sideways | See below. |
| Bulleted list | 8 px **round** markers in `brand`, 22 px text indent, 10 px gap | | |
| Numbered list | numbers in 26 px circles: `brand` text on `brand` at 14%, mono 13 px / 600 | | 38 px text indent. |
| Quote | 22 / 1.5 / 500, `foreground`, a 3 px `brand` bar on the left, 22 px padding, 30 px vertical margin | 19 | |

**Code block:**

- A bar on top: the file name (mono 12 px, `#8E96B5`) and a **Copy** button on the right (30 px tall, a 1 px `#2A3360` border, radius 8, a copy icon plus "Copy").
- Clicking Copy writes the code to the clipboard. The button turns `success` and reads "Copied" for 1 s.
- Syntax colors in the prototype: keywords `#8FB4FF`, strings `#C6F432`, comments `#5B6280`. Use Shiki (server-side) with a matching theme. The panel stays dark in both themes.

Images inside the body, tables and embeds are not designed yet.

## Accessibility and SEO

- One `<article>`; the h1 is the title; the body headings start at h2.
- The topic and tags are links. The tags container has `aria-label` "Tags".
- The Copy button has an `aria-label`; the "Copied" state is announced through `aria-live="polite"`.
- JSON-LD `BlogPosting`: headline, datePublished, author (Person), image, keywords (tags).
