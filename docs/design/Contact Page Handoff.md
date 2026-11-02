---
tags: [design, handoff, contact]
status: approved
updated: 2026-11-02
---

# Contact Page Handoff

`/[locale]/contact` has the direct contacts (click to copy), a feedback form, and two panels that react to the form: **Ready to send** (a progress ring and a checklist) and a **live request** (the form shown as the JSON request it will send). Approved variant: **E (A + D combined)** on the design canvas.

See [[README]] for shared rules and files. Data: `profile.contacts`, `replyChannels` and `ContactRequest` in `shared/content.ts`. Messages: the `ContactPage` namespace.

## Scope and order

1. Static route: hero, contacts tile, form markup (server-rendered, works without JS as a normal POST to a Server Action).
2. A Server Action `sendContact(formData)`: Zod validation with the same rules as the client, then delivery (email or Telegram bot, decided later). Rate-limit by IP and add a honeypot field. Stage 3 also stores the message, because the admin has an inbox.
3. A client form component: live validation, field states, reply-channel switching, submit states and the success view. Use React Hook Form + Zod, or `useActionState`.
4. Click-to-copy contacts with a "Copied" tooltip.
5. The Ready-to-send panel (desktop sticky; phone sticky and compact).
6. The live request panel.
7. Reduced motion and an accessibility pass.

## Layout

**Desktop:**

- Hero: padding 40 × 56 × 8 px; label, h1 56 px, intro up to 620 px wide.
- A **contacts tile** across the full width: three columns (`1fr 1.5fr 1.2fr`) separated by 1 px `card-border` lines. Each column has a mono label (Phone / Email / LinkedIn), the value (15 px / 600) and a 30 px copy icon button.
- Below: a grid `minmax(0, 1fr) 400px`, gap 24 px, padding 16 × 56 × 56 px.
  - Left column: the **form tile**.
  - Right column: a sticky panel (`top: 20px`) with **Ready to send** (compact) on top and the **live request** under it, gap 12 px.

**Phone** (order matters): hero → contacts → Ready to send → live request → form.

- Contacts become rows: the label on the left, the value and copy icon on the right, with 1 px dividers.
- **Ready to send is sticky** (`top: 0` inside the page scroller, i.e. under the header). When it gets stuck (it has scrolled to the top), it turns into a **compact bar**:
  - full bleed: −14 px side margins, no radius, only a bottom border, padding 10 × 14 px, a soft shadow;
  - the header line and the message are hidden;
  - the ring shrinks to 32 px;
  - the checklist becomes one row with short labels: Name · Message · Reply · Consent (`ready.stepsShort`).
  - Detect "stuck" with an IntersectionObserver on a 1 px sentinel placed just above the panel.

Tiles: `bg-card`, a 1 px `card-border` border, radius 24 px (20 px on phone), padding 24 px (18 px on phone).

## Contacts (click to copy)

- The whole row is the button (`role="button"`, `tabindex="0"`, Enter or Space copies). Clicking anywhere copies the value: the phone as shown, the full email, the full LinkedIn URL.
- Feedback: a tooltip "Copied" above the row, in theme colors (`bg-primary text-primary-foreground`, 12 px / 600, radius 10, with a small arrow). It is visible for **1 s** and then fades out. The copy icon turns `success` for that second. On phone the tooltip aligns to the right edge.
- Hover or focus: the value and the icon turn `brand`. Focus: a 2 px `brand` outline, offset 4 px.
- Use `navigator.clipboard.writeText`, with a hidden-textarea fallback. Announce "Copied" through an `aria-live="polite"` region.

## Form

Fields, top to bottom (gap 18 px). All of them are required.

| Field | Control | Rule | Error |
|---|---|---|---|
| Name | input, `autocomplete="name"` | ≥ 2 characters | "Please enter your name" |
| **Message** | **textarea**, 4 rows, min height 112 px, vertical resize | ≥ 2 characters after trimming | "Please write a short message" |
| How should I reply? | radio group shown as pills: Email (default), Phone, WhatsApp, Telegram, LinkedIn | — | — |
| Contact | input whose label, placeholder, type, autocomplete, hint and rule depend on the channel (table below) | see below | see below |
| Consent | checkbox + "I agree to the processing of my personal data to get a reply." + a Privacy policy link | checked | "Please confirm to continue" |

| Channel | Label | Type | Rule |
|---|---|---|---|
| Email | Your email | `email` | `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` |
| Phone | Your phone | `tel` | 7–20 characters from `+0-9 ()-`, at least 8 digits |
| WhatsApp | WhatsApp number | `tel` | the same as Phone |
| Telegram | Telegram username | `text` | an optional `@` or `t.me/`, then 5–32 letters, digits or `_` |
| LinkedIn | LinkedIn profile | `url` | `linkedin.com/in/<3–100 chars>` |

An empty contact field shows "Tell me where to reply". Labels, placeholders, hints and errors are in messages.

**Control style:**

- Inputs are 46 px tall, radius 12, `bg-background`, a 1 px `card-border` border. Focus: a `brand` border plus a 3 px `brand` ring at 22%.
- Valid: a `success` border and a check icon at the right inside the field (top-right for the textarea).
- Invalid: a `destructive` border, a 3 px `destructive` ring at 18%, and the error text (13 px) under the field; the hint is hidden.
- Reply pills: 38 px tall, mono 13 px, `border` outline. Selected: `bg-foreground text-background` with a `brand` dot.

**Validation timing:**

- A field is validated on blur once it has a value, then live on every input after that.
- Consent is validated on change.
- Switching the channel revalidates the contact field only if it was already touched.

**Submit:**

- The button is a primary pill, 48 px tall (full width on phone).
- With errors: every field is marked, the first invalid field shakes (0.4 s) and gets focus, and a note next to the button says "N fields need attention".
- While sending: the button is disabled and reads "Sending…".
- **Success** replaces the form with a thank-you view: "Thanks, {first name}!", "Your message is on its way. I'll reply via {channel} within 24 hours." and a "Send another" button that resets everything.
- Enter in a single-line input submits; Enter in the textarea adds a new line.

## Ready to send (progress)

- Header: a mono label "Ready to send" on the left and the percentage in `brand` mono 13 px on the right.
- A ring (64 px, stroke 12 in a 120 viewBox; the track is `border`, the progress is `brand`; the dash offset is animated 0.5 s). It turns `destructive` while any field has an error.
- A checklist with **4 steps**: Your name · Message · Where to reply · Consent. Each step has an 18 px circle:
  - done: filled `brand` with a check;
  - error: a `destructive` outline with "!" and `destructive` text;
  - otherwise empty.
- The percentage is done ÷ 4.
- The message line under the ring (13 px) reacts to the form:
  - idle: "Move the cursor over the form, then start typing.";
  - after the first input: "Nice, keep going.";
  - when a field becomes valid: "{step} ✓";
  - when a field becomes invalid: its error text;
  - all valid: "All set. Hit Send!";
  - failed submit: "N steps left before I can reply." and the ring shakes;
  - success: "Sent! Talk soon."

## Live request panel

- A dark code panel (`#0B0F22` in both themes, radius 24, mono 13 / 1.7).
- Tab bar: three dots, the file name `contact.request.ts`, and a status on the right:
  - `idle` in muted;
  - `editing…` in `#FFD23F`;
  - `valid` in `#5BE49B`;
  - `type error`, `422` in `#FF8A80`;
  - `200 OK` in `#5BE49B`.
- Lines with line numbers:

  ```
  POST /api/contact
  {
    "name": "…",
    "message": "…",
    "replyVia": "email",
    "contact": "…",
    "consent": false
  }
  ```

  - The message value is shortened to 60 characters plus "…".
  - The line of the focused field is highlighted (lime at 7%).
  - Each validated field shows ✓ (green) or ✕ (red) in a gutter column. An invalid value gets a wavy red underline, and a comment line under it: `// ✕ <error>`.
- A response box at the bottom, with a dashed border:
  - idle: "// Fill in the form — the request builds itself here.";
  - while sending: "→ sending…" in yellow;
  - success: `← 200 OK { "status": "sent", "replyWithin": "24h" }` in green;
  - failed submit: `← 422 Unprocessable Entity { "errors": N }` in red.
- It is decorative. Mark the panel `aria-hidden="true"`, because the form and its errors carry the real information.

## Motion

On desktop, the form tile has a soft `brand` glow (radial gradient, 420 px) that follows the cursor. A valid field pulses once with a `success` ring. Both are skipped with reduced motion, and so are the shake and the ring animation.

## Accessibility

- Every input has a `<label>`; the reply channels are a `radiogroup` with a visible label.
- An invalid field gets `aria-invalid="true"` and `aria-describedby` pointing to its error. The submit note and the success view are in an `aria-live="polite"` region.
- Touch targets ≥ 44 px (the pills are 38 px tall but laid out with a 6 px gap; make the hit area 44 px).
