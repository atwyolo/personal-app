---
tags: [adr, testing]
status: accepted
date: 2026-10-28
updated: 2026-11-11
---

# ADR-0007 Testing

## Context
The project workflow is test-driven, and the project had no test runner. Next.js 16 documents four tools (Vitest, Jest, Playwright, Cypress) and notes that Vitest does not support async Server Components, recommending end-to-end tests for them.

## Decision
- **Vitest + React Testing Library** (`@testing-library/user-event`, `@testing-library/jest-dom`) for pure logic and client components. Tests are colocated: `src/**/*.test.{ts,tsx}`. Environment `jsdom`.
- **Playwright** for end-to-end tests in `e2e/`, run against a production build (`next build && next start`), in two projects: desktop 1280 px and mobile 390 px (the design frames).
- TDD applies to logic and client components, the content loader included (its tests build their files in a temporary folder). Async Server Components and the rendered content are covered by Playwright.

## Alternatives
- Jest: same API, but needs a transform setup for TypeScript and ESM; Vitest is faster and works with them out of the box.
- Cypress: comparable E2E; Playwright is faster in parallel, runs several browser engines and has a first-class test runner.
- Vitest only, Playwright later: fewer tools now, but the home page is an async Server Component that Vitest cannot render.

## Consequences
- `@vitejs/plugin-react` and `vite-tsconfig-paths` from the Next guide are not used. The React plugin conflicts on an optional Babel 8 peer, and Vite 8 covers both needs: Oxc compiles JSX from tsconfig's `"jsx": "react-jsx"`, `resolve.tsconfigPaths` resolves `@/*`.
- `@types/node` raised to `^22` (required by Vitest 5; matches the local Node 22).
- E2E tests run against frozen test content in `e2e/content/`, not the real content, so editing the content does not break them ([[ADR-0017 Test Content Fixtures]], 2026-11-11). Until then they compared pages with `messages/`; until 2026-11-04 they ran against the production database ([[ADR-0002 Database and ORM]]); the site has none now ([[ADR-0015 Content in Files]]).
- Playwright browsers live outside the repo: `npx playwright install chromium` once per machine.
- `test-driven-development` comes from superpowers, see [[ADR-0010 Superpowers Workflow]].
