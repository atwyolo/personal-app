---
tags: [adr, deploy, ci]
status: accepted
date: 2026-11-02
---

# ADR-0013 Version Tracking

## Context
The owner keeps the version in `package.json` by semver and wants to confirm that a deployment runs the expected build (2026-11-02). Nothing in the code used the version, the repository had no CI, and `develop` and `main` had no protection rules or rulesets.

A version alone proves little: two commits can carry one version when nobody raised it. So there are two parts: show the build, and make the version rise.

## Decision

### Show the build
Every page carries `<meta name="app-version" content="0.2.0+4eee3cf">`, set through `metadata.other` in the root layout. The value comes from `src/shared/lib/app-version.ts`: the version from `package.json` and seven characters of `VERCEL_GIT_COMMIT_SHA`, joined as semver build metadata. A build without the variable shows the bare version. The owner checks it in DevTools (owner's decision).

### Make the version rise
`.github/workflows/version-check.yml` runs on pull requests into `develop`. Its job `Version is raised` compares the version in GitHub's trial merge with the version in the current `develop`, using the `semver` CLI, and fails unless the first is higher.

Every pull request raises the version, with no exceptions (owner's decision): each merge into `develop` starts a new build, and it has to be told apart from the previous one.

The owner picks the level at the end of a step, and the rule in `CLAUDE.md` runs `npm version <level> --no-git-tag-version`.

## Alternatives

### Where to show the build
- **`/api/version` endpoint:** easy to script and hidden from visitors, and it was Claude's first recommendation. It reports the server, not the page that was served. The owner chose the tag.
- **Response header through `headers()`:** works on every page, the 404 included, but is the least obvious to find.
- **Footer label:** visible at once, but to every visitor, and it is not in the design handoff.
- **Vercel dashboard only:** no code, no semver, and the data comes from Vercel rather than from the app.

### How to compare
- **A script with `semver` in `devDependencies`:** testable with Vitest, but it adds a dependency, a file and `npm ci` for one line of logic.
- **A Marketplace action:** no code, and third-party code in CI.
- **A string comparison:** `"0.10.0" > "0.9.0"` is false.

### What to compare against
- **The trial merge's first parent (`HEAD^1`):** needs no fetch, but it is frozen when the merge is built, so a re-run repeats the old answer. Replaced by `git fetch` of `develop` after the review.

### How to raise the version
- **Plain `npm version`:** it commits and tags, and the owner commits in this project.
- **Editing `package.json` by hand:** leaves the version in `package-lock.json` behind.
- **`release-please` or `changesets`:** automation that needs a release flow the project does not have yet.

## Consequences
- The check only reports until a ruleset requires it. To set up after its first run, on `develop` only: require `Version is raised`, require branches to be up to date, and allow the admin to bypass, because `main` is merged back into `develop` with a direct push. A ruleset on `main` would wait forever, since the job does not run there. The bypass on a personal repository is to be confirmed when setting it up.
- Without "up to date", two pull requests that raise the version alike merge without a conflict, and the second stays green until a new push or a re-run. A re-run of the job sees the fresh `develop`, but nothing starts it by itself.
- Pull requests that touch only documentation raise the version too, with a `patch`.
- If exceptions are ever needed, they go through a label and a job-level `if`: a skipped job reports success, while a workflow skipped by `paths-ignore` leaves a required check pending forever.
- No git tags are created. Add them on `main` if a release history becomes useful.
- On the 404 page the tag exists only in the DOM. The response is an error shell of about 1.2 KB, an effect of `partialPrefetching` with `cacheComponents`, so View Source and `curl` show nothing there, measured on a local production build. Check it in the Elements panel.
- Prerendered pages hold the commit of the build, which is the intent: the tag describes the build that produced the page.
- `VERCEL_GIT_COMMIT_SHA` needs "Enable access to System Environment Variables" in the Vercel project. Confirmed on a deployment: the tag showed `0.2.0+76ea562`. Without it the tag shows the bare version and no test notices.
- Playwright builds with a fixed commit from `e2e/build-commit.ts`, so `.next` after an e2e run holds a fake commit.
- The workflow's script was run against simulated merges and a local remote, then passed on GitHub on its first pull request, PR #7.
