---
tags: [design, handoff, admin]
status: approved
updated: 2026-11-02
---

# Admin Handoff

`/admin` is the content editor for the whole site. A left sidebar picks the page to edit and the **content language**. The main area shows that page's blocks as forms. One save bar applies the changes. This supersedes the earlier note that the admin would use stock shadcn screens; build it from shadcn components styled with the site tokens.

See [[README]] for shared rules. The fields here are exactly the shapes in `shared/content.ts`, so each form maps to one content type.

## Files

| File | What it shows |
|---|---|
| `admin/screens/{desktop,phone}-dark-<section>.png` | The top of each section: `home`, `about`, `experience`, `skills`, `blog`, `contact` |
| `admin/screens/*-dark-<section>-2.png` | Further down in Home (About block), About (pairs), Experience (full description and skills), Skills (table) |
| `admin/screens/*-dark-blog-edit.png` | The post editor |
| `admin/screens/phone-dark-drawer.png` | The phone sidebar drawer |
| `admin/screens/desktop-dark-theme-menu.png` | The theme menu in the header |
| `admin/screens/desktop-dark-ru-fallback.png` | Editing in Russian, with English fallbacks marked |
| `admin/screens/*-light-{home,skills}.png` | The light theme |
| `admin/prototype.dc.html` | Prototype source: every control is clickable there (page switching, language, accordions, add and delete pairs, domains and topics, skill toggles, the save bar) |

## Scope and order (Stage 3, after the DB)

1. Auth guard for `/admin` (Auth.js or a single-owner password plus a session cookie). The admin is not localized: its UI language is a separate setting (below).
2. Shell: header, sidebar, phone drawer, save bar and toast.
3. Content language switching with fallback markers.
4. Section forms, in this order: Home → About → Experience → Skills → Blog (list, editor, topics) → Contact inbox.
5. Writes go through Server Actions with Zod. After saving, revalidate the affected public routes for that locale (`revalidatePath`).

## Shell

**Header** (64 px, `bg-card`, a bottom border):

- Desktop: **View site ↗** (`text-brand`, 600, opens the public site) on the far left; then, right-aligned, the **interface language** menu, the **theme** menu, and **Log out**.
  - The two menus are pills with a chevron: the language shows its code ("EN"), the theme shows a moon or sun icon.
  - Log out is an icon plus the label, in `text-brand`.
- Phone: a burger (opens the drawer), the current section name (16 px / 600), then the language and theme as 38 px icon buttons.
- Both menus are popovers like the public header: radius 16, items 38 px tall, the selected item in `brand` with a check.
  - Interface languages: the 8 site locales (native names, code hint).
  - Theme: Dark, Light, System ("auto" hint).
- **The interface language only changes the admin UI.** It does not change which content language is being edited.

**Sidebar** (desktop: 248 px, `bg-card`, a right border, padding 18 × 14 px; sections 22 px apart):

- **Content language**: a select button (globe icon, language name, percentage translated, chevron) that expands an inline list. Each row shows the code, the name, a 4 px progress bar and the percentage. The hint below reads "Text fields are saved for the selected language. Empty fields fall back to English."
- **Pages**: Home, About, Experience, Skills, Blog, Contact. Rows are 42 px tall with an icon.
  - The active row is `bg-foreground text-background` with the icon in `brand`.
  - Contact shows a `brand` badge with the unread count.
- Phone: the same sidebar as a 300 px drawer from the left, with a scrim.
  - The top row has **View site ↗** and a close button.
  - **Log out** (icon plus label, `brand`) is pinned at the bottom.
  - Choosing a page closes the drawer.

**Main** (max 860 px, padding 24 × 28 × 110 px; on phone 16 × 12 × 100 px):

- A page head: h1 (30 px; 24 px on phone), a one-line description, "Editing **{language}**" on the right, and a page action button where present.
- Blocks are cards: `bg-card`, a border, radius 20, padding 20 × 22 px. Each card has an h2 (17 px) and an optional description.
- Fields sit in a 2-column grid (1 column on phone).

**Save bar**:

- It slides up from the bottom of the main area on the first change: "Unsaved: **N changes**", then **Discard** and **Save** (primary).
- Saving shows a toast "Saved · {language}".
- Switching the content language with unsaved changes should ask to save or discard. That dialog is not drawn; use a shadcn AlertDialog.

## Shared field types

| Type | Look | Notes |
|---|---|---|
| Text, textarea | 40 px input, radius 10, `bg-background` | Focus as on Contact. |
| **Rich text** | A toolbar plus a contenteditable area (min 110 px) inside one bordered box | **Tiptap.** Toolbars by field: "text" = Bold, Italic, Underline, Link, Bulleted, Numbered. The post body adds H2–H4, Quote, Code block, Image. Store sanitized HTML (`RichText`). Show the placeholder when empty. |
| Image upload | A dashed drop zone: a 64 px thumbnail, "Drop a file or browse", a hint | A **?** icon (18 px, `brand` outline circle) next to the label shows a tooltip (hover, focus or tap) with the optimal image guidelines for that slot (below). |
| Month | An input with a calendar button inside on the right (34 × 30 px, `brand` on `brand` at 16%) | The whole button opens the native month picker. |
| Skill picker | Chips plus an input with suggestions from the Skills list | Enter or picking a suggestion adds a chip; × removes it. |
| Toggle | A 40 × 24 px switch; on = `brand` | |
| Name list | Rows of [name input · "N items" · delete], then "+ Add …" | Used for skill domains and blog topics. |

**Translatable vs shared fields:**

- Translatable fields hold one value per locale.
- When the editing language is not English and a translatable field is empty:
  - the field shows the English text as its placeholder;
  - the border is dashed;
  - an **"English fallback"** badge is shown next to the label.
- Non-translatable fields (name, contacts, dates, files, slugs) show a lock badge **"all languages"** when editing a non-English locale.

**Image guidelines** (tooltip text):

- **Photo**: square 1:1, at least 1200 × 1200 px; JPG or WebP up to 500 KB; face centered with room around the head; calm background, no text.
- **Company image**: 16:10, 1600 × 1000 px; JPG, WebP or PNG up to 400 KB; keep the subject in the central 60%; no small text.
- **Post cover**: 16:9, 1600 × 900 px or larger; JPG or WebP up to 600 KB; nothing important near the edges. The site converts and resizes automatically.

## Sections

**Home**:

- Hero: Name (shared), Headline.
- Photo and CV: Photo (with tooltip), CV PDF.
- Contacts (shared): WhatsApp number, Email, LinkedIn URL. "Also shown on the Contact page."
- About block: **Text** (rich text, the only field).
- There are no hero tags (they come from Skills) and no "other blocks" card.

**About**:

- Page header: Title, Intro.
- **Questions and answers · N**: an accordion of pairs, any number of them. The header button and a bottom link add a pair; new pairs open with focus on Title.
- Each pair holds:
  - **Title** (the chip label; hint "Shown as the section chip and in the page index");
  - **Question** (the interviewer's message);
  - **Answer title** (one sentence, shown larger);
  - **Answer body** (rich text, "text" toolbar);
  - **Delete this pair** (`destructive` link).
- The collapsed row shows a drag handle (reorder), the title, the question and a "Needs answer" badge while Answer title is empty. Title and question update live.

**Experience** (one accordion per place of work, sorted by start date, newest first; no drag handles):

- Company (shared), Role.
- Start and End (month; End empty = "present").
- Anchor id (hint `/projects#id`).
- Company image (with tooltip).
- **Short description**: up to 3 sentences, with a counter "/320". It is used on the Home card and at the top of the job.
- **Full description**: rich text.
- **Skills**: the skill picker; 3–5 are shown as tags.
- "Add place" in the page head. A "Role missing" badge shows while Role is empty.

**Skills**:

- **Domains** card first: a name list (translatable names, skill count, delete, "Add domain").
- Then the skills table, showing **all skills** (no paging). The toolbar has search, domain filter pills with counts, and counters "Top: N · Main: N" (no limit).
- Columns:
  - drag handle;
  - Name;
  - Domain (select);
  - Level: a −/+ stepper 1–10 with a 10-segment mini bar;
  - **Top**: toggle, drives "My top skills" on Home;
  - **Main**: toggle, see Open questions in [[README]];
  - delete.
- On phone the table scrolls sideways (min width 640 px).

**Blog**:

- **Topics** card first: a name list (translatable names, post count, delete, "Add topic").
- Then the posts table: search, status pills (All / Published / Drafts), and rows with title + tags, topic badge, status pill, date and a chevron. "New post" is in the page head.
- **Post editor** (opens from a row; "‹ Back to posts" link):
  - Post: Title, Slug (shared; hint with the URL), Topic (select), Tags (chips), Cover (with tooltip), Excerpt (2–3 sentences).
  - Body: rich text with the full toolbar.
  - Publishing: Status (Draft / Published), Publish date.

**Contact** (inbox, newest first):

- Filter pills: All / Unread (count).
- Each message is an accordion row: an unread dot, the sender name, a one-line preview of the **message** (ellipsis; hidden when open), the channel badge, and the date.
- Opened, it shows the full message in a bordered block, then a details list: Reply via, Contact, Consent, Language. Actions: **Reply via {channel} ↗** (primary; opens `mailto:`, `tel:`, `wa.me`, `t.me` or the LinkedIn profile), Mark as read, delete.
- A card **Form texts** (translatable): Intro, Success message (with a `{channel}` placeholder).

## Data notes (for the DB schema)

- Translations: one row per (entity, locale) for translatable columns, or JSON columns keyed by locale. Missing values fall back to `en` on the site.
- New or changed fields:
  - `profile.about` (rich text);
  - `about_pairs` (sort, title, question, answer_title, answer_body);
  - `experience.description` and `experience.body` (rich text), plus `experience_skills`;
  - `skills.featured` and `skills.main`;
  - `skill_domains` and `post_topics` as editable tables;
  - `contact_messages` (name, message, reply_via, contact, consent, locale, created_at, read_at).
