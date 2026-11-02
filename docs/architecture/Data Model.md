---
tags: [architecture, database]
updated: 2026-11-02
---

# Data Model

Agreed for the home page on 2026-10-28; the rest stays a draft until its stage. Pattern: every entity with user-facing text has a sibling translation table. See [[ADR-0003 Content Localization]] and [[ADR-0002 Database and ORM]].

## Conventions

- Every table has `id`, `created_at`, `updated_at`. Lists the owner orders by hand have `sort`.
- Store facts, not formatted strings: dates as `date`, phone as E.164. Display strings (periods, durations, `wa.me` links) are computed at render time with `Intl` / next-intl.
- Files live in Vercel Blob (public store). The database keeps only the blob URL; `del(url)` removes the file when it is replaced.
- Rich text is Tiptap JSON in `jsonb`. It is a document, not a localization strategy.
- No alt-text fields: each image uses an existing text as alt (see per entity).

## Home page entities

### `profile` (singleton, `CHECK (id = 1)`)
| Column | Type | Notes |
|---|---|---|
| `photo_url` | text | Blob URL. Alt = translated `name`. LCP image. |
| `whatsapp_phone` | text | E.164, e.g. `+37493310039`. Link and display format are derived. Editable in admin. |
| `email` | text | Editable in admin. Mailbox name for the button is derived. |
| `linkedin_url` | text | Editable in admin. |

### `profile_translations`
| Column | Type | Notes |
|---|---|---|
| `name` | text | |
| `headline` | text | "Senior Frontend Software Engineer, 8+ years" |
| `job_title` | text | Plain title for structured data, "Senior Frontend Software Engineer". Required in `en` (added 2026-11-02). |
| `about_short` | jsonb | Home page About on mobile and desktop: lead, results title, bullet list. |
| `meta_description` | text | Plain-text page description for `<meta name="description">` and Open Graph, ~160 characters (validated by Zod in the admin, not in the database). Required in `en` (added 2026-10-29). |
| `cv_url` | text, nullable | Blob URL of the PDF for this locale, stored as the blob `downloadUrl` (`?download=1`), because `<a download>` is ignored cross-origin. |

### `experience`
| Column | Type | Notes |
|---|---|---|
| `slug` | text unique | Anchor for "Learn more" (`/about#glovo`). |
| `company` | text | Not translated. Also the image alt. |
| `start_date` | date | First day of the month. |
| `end_date` | date, nullable | `null` = present. Duration is computed. |
| `image_url` | text, nullable | Blob URL; `null` renders the striped placeholder. |
| `sort` | integer | |

### `experience_translations`
| Column | Type | Notes |
|---|---|---|
| `role` | text, nullable | Not shown on the home card; needed by the About page. |
| `description_short` | jsonb | Card text, up to 3 sentences. Marks only: bold, italic, link. |
| `description_full` | jsonb, nullable | Detailed text for the About page. |

### `experience_skills` (many-to-many)
`experience_id`, `skill_id`, `sort`. 3–5 skills per card. Primary key `(experience_id, skill_id)`.

### `skill_domains` + `skill_domain_translations`
`skill_domains`: `key` (unique, e.g. `core`), `sort`. Translations: `label`. Replaces the hard-coded categories in messages.

### `skills` (no translation table: tech names are not translated)
| Column | Type | Notes |
|---|---|---|
| `name` | text unique | |
| `level` | smallint | `CHECK (level BETWEEN 1 AND 10)` |
| `domain_id` | fk → `skill_domains` | Exactly one domain per skill. |
| `main` | boolean, default false | `true` = shown as a hero chip. Chips are ordered by `sort`. |
| `top` | boolean, default false | `true` = shown in "My top skills" on the home page, without a limit. Ordered by level desc, then `sort`, then `name`. |
| `sort` | integer | Order in skill lists: level desc, then `sort`, then `name`. |

### `posts`
| Column | Type | Notes |
|---|---|---|
| `slug` | text unique | One English slug for all locales. |
| `status` | enum `draft` / `published` | |
| `topic_id` | fk → `post_topics`, `on delete restrict` | Exactly one topic per post, drafts included. Indexed. |
| `published_at` | timestamptz, nullable | Set on publish; shown on cards. |
| `cover_url` | text, nullable | Blob URL. Alt = translated `title`. |

### `post_topics` + `post_topic_translations`
`post_topics`: `key` (unique, e.g. `technical`, used in URLs and filters), `sort`. Translations: `label`, filled for all eight locales. The number of posts in a topic is not stored: it comes from a left join with published `posts`, so a topic with no posts counts as 0. Replaces the enum and the topic labels in messages from the [[Blog Page Handoff]]; the filter's "All" stays in messages, it is not a topic (owner's decision, 2026-11-01).

### `post_translations`
| Column | Type | Notes |
|---|---|---|
| `title` | text | |
| `excerpt` | jsonb | Card text, 2–3 sentences. |
| `body` | jsonb, nullable | Full post (Stage 4). Inline images are Blob URLs inside the JSON. |
| `tags` | text[] | Free-form, per locale, not linked to `skills`. Admin edits them as a comma-separated input. |

## About page entities

Agreed on 2026-11-02, see [[2026-11-02-about-page-design]].

### `about_pairs`
| Column | Type | Notes |
|---|---|---|
| `slug` | text unique | The section's id and the chip's anchor (`/about#who`). Entered by hand, never generated. Not translated. |
| `sort` | integer | Reading order. |

### `about_pair_translations`
| Column | Type | Notes |
|---|---|---|
| `link_text` | text | Text of the sticky chip. |
| `question_title` | text | Small label inside the question bubble. |
| `question_message` | text | The question, an `h2`. |
| `answer_title` | text | The first line of the answer, shown larger. |
| `answer_message` | jsonb | Rich text. |

All five are required in `en`.

## Translation table shape

```
<entity>_translations
  <entity>_id   fk → <entity>.id on delete cascade
  locale        locale enum
  ...fields     nullable
  primary key (<entity>_id, locale)
  check: locale <> 'en' or (required fields are not null)
```

The pair `(<entity>_id, locale)` is the natural key, so it is the primary key; a surrogate `id` would add nothing. The check constraint makes the `en` row complete, which is what lets queries treat fallback values as non-null.

**Fallback is per field, not per row.** The `en` row is complete; other locales may leave any field `null`. A query joins the requested locale and `en` and takes `coalesce(requested.field, en.field)`. Example: `ja` has a title but no `cv_url` → the Japanese title and the English CV.

## Later stages (draft)

- `projects` + `project_translations`: slug, url, repo_url, year, featured, sort; title, summary, body (rich text).
- `post_views`: view counter per post (Stage 4).
- `contact_messages`: name, email, message, locale, created_at, read_at (Stage 5).
- `users`: admin accounts for Auth.js credentials (email, password_hash) (Stage 6).
