---
tags: [design, handoff, about]
status: approved
updated: 2026-11-02
---

# About Page Handoff

`/[locale]/about` presents the extended bio as a short **interview**. Each section heading is a question a recruiter would ask, and the answer appears as a chat reply. Approved variant: **C (Interview)** on the design canvas.

See [[README]] for shared rules and files. Data: `aboutSections` in `shared/content.ts`. Messages: the `About` namespace.

## Changes since 2026-11-01

- **"‹ Back" link** above the hero label (style in [[README]]).
- **The pairs are data, not a fixed six.** The admin can add, delete and reorder question–answer pairs. Each pair has `title` (chip label), `question` (the h2), `answerTitle` (the first line, shown larger) and `answerBody` (rich text). Render however many there are.
- **The "results" section is ordinary rich text now:** its bullets live in its `answerBody`, not in `profile.about.results`.
- **The contact buttons** under "What I'm looking for" use the themed style: `bg-card`, a `card-border` border, `text-foreground`, a `brand` ↗ after the label, and a `brand` border on hover. Download CV stays `primary`. They show where `showContacts` is set (see Open questions in [[README]]).

## Scope and order

1. Static route: hero plus one `<section id>` per entry in `aboutSections`.
2. Question and answer bubbles (server components).
3. Sticky question chips (client: active state, smooth scroll, auto-scrolling the chip row).
4. Reveal on scroll (CSS, or a tiny observer), with reduced motion respected.

## Layout

- **Hero**: label "About", h1 "About me" (56 px desktop, 36 px phone), and an intro of at most 640 px: "A short interview with myself: the questions recruiters ask most, answered properly."
- **Question chips bar**, sticky under the header:
  - `bg-background` with a bottom border, padding 12 × 48 px (desktop) and 10 × 14 px (phone).
  - One chip per section, labelled with the section `title` (Who I am, How I work, …): mono 12 px, a pill with a `card-border` outline.
  - The active chip is `bg-foreground text-background`.
  - The row scrolls horizontally with the scrollbar hidden. When the active chip changes, scroll it into view.
  - Clicking a chip smooth-scrolls to its section, offset by the header and the bar.
- **Conversation column**: `max-width: 820px`, centered; padding 8 × 48 × 64 px on desktop and 8 × 14 × 40 px on phone; 28 px between sections (22 px on phone).

## Section (`<section class="qa" id="{id}">`)

- **Question = `h2`**, right-aligned bubble:
  - max width 70% (85% on phone), padding 14 × 18 px, radius `20 20 6 20`;
  - `bg-primary text-primary-foreground`: brand fill, so lime in dark and blue in light;
  - inside: a small mono label with the section `title` (11 px uppercase, 75% opacity), then the `question` at 18 px / 600 (16 px on phone).
- **Answer**, left-aligned, max width 88% (100% on phone):
  - an avatar, a 40 px circle (32 px on phone), with a `card` fill, a `card-border` border and the initials "MA" in `brand` mono. Swap in the real photo later;
  - a bubble: `card` with a `card-border` border, radius `20 20 20 6`, padding 18 × 20 px, and a 12 px gap between its parts:
    - `answerTitle`: 19 px / 1.45 / 500 (16 px on phone);
    - `answerBody` with `<RichText>`: paragraphs at 16 px / 1.7 in `foreground-soft`, lists with `deco` squares;
    - when `showContacts` is set: the compact contact buttons (40 px, radius 12): WhatsApp, Mail and LinkedIn themed as above, Download CV in `primary`. The page has no footer, so this is the call to action.

## Motion

- When a section's top crosses 85% of the viewport, the question fades up (opacity 0→1, `translateY 16px→0`, 0.45–0.5 s). The answer follows 350 ms later.
- With reduced motion, or without JS, everything is visible immediately. Do not hide content in the server HTML: start hidden only after hydration, for example with a `data-js` attribute on `<html>`.
- **Active chip:** the last section whose top is above 40% of the viewport. At the bottom of the page, the last section is active.

## Accessibility and SEO

- Each section is a landmark-free `<section>` with its `h2`; the order of questions is the reading order.
- The avatar is decorative (`aria-hidden`); the bubble text carries the content.
- Chips are links `<a href="#id">` inside `<nav aria-label="Questions">`; the active one gets `aria-current="true"`.
- Use JSON-LD `ProfilePage` + `Person` (name, jobTitle, sameAs: LinkedIn).

Owner TODOs in `content.ts`: where you are based, what you're looking for, outside of work. The questions themselves can be reworded freely.
