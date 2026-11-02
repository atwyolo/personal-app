# CLAUDE.md — project rules for `personal`

Personal portfolio site. Two goals of equal weight: a working site, and the owner learning Next.js by building it.

## Working with the owner (mandatory)

These rules apply to every reply and every task, however small. The owner's words, 2026-10-31.

- **Teach in every reply.** Explain everything we touch, not only what was asked: how it works, why it is built this way, and related topics that help the owner learn, in the form "by the way, since we touched X...". This covers Next.js and everything around it: React, browsers, CSS, tooling, testing, the database.
- **Learning content stays in the chat.** Nothing in the repository teaches: no learning notes, no tutorials, no general explanations of how a tool works. `docs/` records project facts, decisions and their reasons.
- **The owner sees every decision.** Real choices go to the owner. When Claude decides something itself, it reports it: what was chosen, which alternatives existed, why this one is the best. Nothing is decided silently: the owner wants a full picture of the codebase.
- **Maximum effort.** The goal is the best quality of the project and the owner's full awareness of it and of every aspect of working with Next.js.

## Language

- Everything inside this repository is written in **English**: code, comments, commit messages, docs in `docs/`, UI copy source strings.
- Conversation with the owner happens in Russian (global rule). Never mix the two: no Russian in files, no English chat.

## Stack (decided, do not re-litigate)

- Next.js 16 App Router, React 19, TypeScript strict, `src/` layout, `@/*` alias, npm.
- Styling: Tailwind v4 + shadcn/ui (Base UI, style `base-nova`). Generated components live in `src/shared/shadcn` and are wrapped by our own adapters in `src/shared/ui`.
- Data: Neon Postgres via Vercel Marketplace, Drizzle ORM with `@neondatabase/serverless` (HTTP driver). One database for local dev, previews and production; schema synced with `drizzle-kit push`, no migration files (see ADR-0002).
- i18n: `next-intl` for UI strings. DB content is localized through **translation tables** (`<entity>_translations` with `locale` column), never jsonb. Locales: `en` (default, fallback), `ru`, `pt`, `es`, `de`, `fr`, `ja`, `pl`.
- Forms: React Hook Form + Zod (`zodResolver`). Zod schemas are the single source of validation on both client and server.
- Tests: Vitest + React Testing Library (colocated `*.test.ts(x)`), Playwright in `e2e/` against a production build.
- Admin: hand-written under `/admin`. Auth.js v5 credentials login, routes protected in proxy. Rich text: Tiptap 3, stored as JSON, rendered server-side on the public site.
- Theme: `next-themes`, class strategy, respects system preference. Provider with a React 19 workaround in `src/app/_providers/ThemeProvider.tsx` (ADR-0008).
- Hosting: Vercel Hobby. Filesystem is read-only at runtime; uploads go to Vercel Blob.

## Before writing code

- Read the matching guide in `node_modules/next/dist/docs/` first. Next 16 APIs differ from older versions (see `AGENTS.md`).
- Discuss approach and alternatives before implementing anything non-trivial (global rule). Confirm, then code.
- Check `docs/Home.md` for the current roadmap, decisions (ADRs) and open questions. Update them when a decision changes.

## Feature workflow: superpowers

The `superpowers` plugin drives the workflow (ADR-0010). Skills to use:

| When | Skill |
|---|---|
| Discuss before coding and write the spec: new feature, unclear ask | `brainstorming` |
| Break a spec into steps | `writing-plans` |
| Build a step | `executing-plans` + `test-driven-development` |
| Bugs, failing tests, broken builds | `systematic-debugging` |
| Before saying a step is done | `verification-before-completion` |
| Before handing a step over | `requesting-code-review`, then `receiving-code-review` for the findings |

The plugin has no topic skills, so these stay plain rules:

- **UI work (pages, components, layout, a11y):** follow the design handoff and "UI sources" below; meet WCAG yourself, nothing checks it for you.
- **Next.js / library APIs:** read `node_modules/next/dist/docs/` and installed package docs first, then context7.
- **Decisions:** write an ADR from `docs/templates/`.
- **Performance pass:** no skill or `/webperf` any more; run Lighthouse and measure the bundle by hand.
- **Admin, auth, forms, uploads:** run the built-in `/security-review` on the pending changes.
- **Risky or irreversible steps (production database):** show the owner the exact SQL or command and get a confirmation first.

Project rules win where the plugin's defaults differ:

- **No commits, branches or worktrees; Claude stages each step.** The owner commits. Wherever a skill says "commit" (`brainstorming`, `writing-plans`, `executing-plans`), stage instead: at the end of every step, stage the step's whole delta with `git add` (new files included) and report it. Plan steps end with `git add`, never `git commit`. Do not use `using-git-worktrees` or `finishing-a-development-branch`. Every new file is either staged or covered by `.gitignore` (extend it when a file must not be versioned); never leave files untracked.
- **End of a step and the commit (owner's rule, 2026-11-01; version bump added 2026-11-02).** When a step is about to end, ask the owner in one message whether they agree with everything and it can be committed, or whether something should still change, and whether the version should be bumped, naming the proposed level (`major`, `minor` or `patch`) and the resulting version. Compare with `origin/develop` after `git fetch origin develop`, because the local branch can lag behind what the version check sees: if the branch already raised the version, say so and propose a further bump only when the level should grow. Give no commit message at this point. When the owner answers that the feature is ready to commit, do these in order:
  1. Bring the documentation fully up to date (plan, spec, architecture notes, ADRs, Roadmap, `docs/Home.md`, journal) and stage it.
  2. Bump the version as the owner answered: a plain "yes" accepts the proposed version, an answer naming another level or version overrides it. Run `npm version <level or version> --no-git-tag-version`, which updates `package.json` and `package-lock.json` without a commit or a tag, and stage both files. Skip this step when no bump was agreed: `npm version` fails on an unchanged version.
  3. Give the suggested Conventional Commit message in the chat.
- **`executing-plans` runs without its scripts.** `task-start`, `task-done`, `review-package` and the `.superpowers/sdd/` ledger are built on commit ranges, which are empty here. The plan's checklist is the ledger: tick a task when its delta is staged. Follow the rest of the skill, including the completion contract. Reviews run on `git diff --cached`, not on `BASE..HEAD`.
- **Specs and plans live in the vault**, in English, with frontmatter and `[[wikilinks]]`: `docs/specs/YYYY-MM-DD-<topic>.md` and `docs/plans/YYYY-MM-DD-<feature>.md`, not `docs/superpowers/`. The plan's task list is a checklist inside the plan note. ADRs go to `docs/decisions/` (template in `docs/templates/`). Link everything from `docs/Home.md`.
- **Learning first.** Implement inline, one step at a time, so every step is visible and explained to the owner. Never use `subagent-driven-development` or `dispatching-parallel-agents` for implementation; do not ask which execution approach to use after `writing-plans`, it is always inline. A read-only review subagent from `requesting-code-review` is fine. Discussion happens in Russian, before any code.
- **Tests** (ADR-0007). `test-driven-development` applies to logic and client components with Vitest. Async Server Components and database-backed pages are verified with Playwright, which must never write to the database (it is the production one). Definition of done for every step: `npm run test:run`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## UI sources: 21st.dev MCP

The `21st` MCP server (user scope) searches the 21st.dev catalog. The design handoff (`docs/design/Home Page Handoff.md`) stays the source of truth; 21st is for references, not replacements.

- **Use:** `search` / `get_inspiration` (free metadata) to find patterns for blocks the handoff leaves open; `search_logo` for brand SVGs (e.g. the contact buttons; the handoff allows swapping its generic glyphs).
- **Code from `get_component` (uses quota) is a reference to adapt, never pasted as is:** rebuild it on our shadcn (Base UI, not Radix) primitives and `shared/ui` adapters, in the right FSD layer, with our naming and component style, Server Components by default. Do not run its install command or add its dependencies without discussing them first.
- **Never** send project source, secrets or paths to 21st, and do not call account-changing tools (publish, delete, profile, bookmarks) or paid AI generation unless the owner asks.

## Conventions

### Architecture (adapted Feature-Sliced Design)

- Layers: `src/app` (routes only) → `src/views` → `src/widgets` → `src/features` → `src/shared` (`ui`, `shadcn`, `lib`). `src/db`, `src/actions` (Server Actions) and `src/schemas` (Zod schemas) sit outside the layers. Full rules: `docs/specs/2026-10-29-home-page-design.md`.
- A layer imports only from layers below it; no imports between slices of the same layer. Only files in a slice root are importable from outside. No barrel `index.ts` files.
- `src/shared/shadcn` is imported only by `src/shared/ui`; `@base-ui/*` only by `src/shared/shadcn`.
- `src/actions` and `src/schemas` have no import-order rules: any layer may import them and they may import any local file. Features may import `src/db` only with `import type`; mutations go through actions.
- Enforced by `eslint-plugin-boundaries` in `eslint.config.mjs` (`npm run lint`).

### Code style

- **File names:** every file containing JSX is PascalCase (`src/views/home/HomePage.tsx`). Custom hook files are camelCase and match the hook name (`usePosts.ts`). Folder names and other non-JSX files stay kebab-case (`src/shared/lib/rich-text.ts`).
- **Exceptions:** Next special files keep the names Next requires (`page.tsx`, `layout.tsx`, `not-found.tsx`, ...). Generated code in `src/shared/shadcn` keeps the shadcn CLI names and style so `npx shadcn add`/`diff` keep working; the rules below do not apply to it.
- **Components** are arrow functions typed with `FC<Props>`, named exports. Props are an `interface <Name>Props` and are destructured on the first line of the body, not in the signature. Async Server Components use `FC` too (`FC` allows `Promise<ReactNode>` in React 19). Next special files assign the component to a const and `export default` it, or re-export a view: `export { HomePage as default } from "@/views/home/HomePage";`.
- **Custom hooks** type both input and output: `interface Use<Name>Params` and `interface Use<Name>`, e.g. `export const usePosts = (params: UsePostsParams): UsePosts => { const { page, limit } = params; ... }`. Params are destructured on the first line.

```tsx
interface HomePageProps {
  title: string;
}

export const HomePage: FC<HomePageProps> = (props) => {
  const { title } = props;

  return <div>{title}</div>;
};
```

### General

- Server Components by default. Add `"use client"` only where hooks, browser APIs or event handlers are required, and keep those leaves small.
- Images render through `src/shared/ui/Image.tsx`, never `next/image` directly: it gives every image the placeholder for a missing source or a failed load.
- Data access goes through `src/db/` (schema, queries). Pages never import the driver directly.
- Mutations are Server Actions in `src/actions/`, validated with the form's Zod schema from `src/schemas/`, returning typed `{ ok, errors }` results for `useActionState`. Every action checks auth itself: actions are public POST endpoints, `proxy` does not protect them.
- Rendering intent is explicit per route: static, ISR (`revalidate`), or dynamic. Note it in a one-line comment at the top of the page file.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`). The owner commits; Claude stages each step's delta (see Feature workflow) and does not commit or push unless asked. Never put Claude session links into commits, PRs or issues.

## Commands

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build, also runs type check
npm run lint     # eslint
npx tsc --noEmit # standalone type check
npm test         # Vitest in watch mode
npm run test:run # Vitest once
npm run test:e2e # Playwright against a production build (first time: npx playwright install chromium)
npm run db:push  # sync schema to the database (shows SQL, asks to confirm)
npm run db:seed  # fill an empty database
npm run db:studio # browse data
```

## Docs vault

`docs/` is an Obsidian-style vault: Markdown with `[[wikilinks]]`, YAML frontmatter, one topic per note. Entry point is `docs/Home.md`. Record architectural decisions as ADRs in `docs/decisions/` and session summaries in `docs/journal/`. Learning content does not go here (see "Working with the owner").
