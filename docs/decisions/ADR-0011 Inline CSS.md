---
tags: [adr, performance]
status: accepted
date: 2026-11-01
---

# ADR-0011 Inline CSS

## Context
The site's CSS is one Tailwind file of 12 KB after compression, and a stylesheet in `<head>` blocks the first paint until it arrives. On a slow connection that file shares the bandwidth with a font, the photo and nine scripts. Most visitors of a portfolio are new, so the browser has no cached copy.

Next offers `experimental.inlineCss`: the CSS of a first load goes into a `<style>` tag. The flag is experimental, applies to every route and cannot be set per page.

A local build pointed the wrong way: 116 ms of FCP for twice the HTML, because a local connection has no real latency. The decision comes from three deployments on Vercel, `/en`, mobile, median of three runs:

| | Three fonts, inlined | One font, inlined | One font, a file |
|---|---|---|---|
| Performance, simulated | 96 | 98 | 97 |
| LCP, simulated | 2618 ms | 2444 ms | 2473 ms |
| Speed Index, simulated | 2792 ms | 1373 ms | 2796 ms |
| FCP, real throttling | 881 ms | 921 ms | 1862 ms |
| LCP, real throttling | 2143 ms | 1978 ms | 2070 ms |
| Document size | 31 KB | 31 KB | 16 KB |

## Decision
Keep `experimental.inlineCss` on (owner's decision, 2026-11-01). On a slow connection the first paint comes about 940 ms earlier, for 15 KB more in the document.

## Alternatives
- **A stylesheet file:** the stable default, cached between visits, with half the document. It doubles the first paint on a slow connection.
- **Inlining critical CSS by hand:** the smallest result, but Tailwind's output is already small, and a second source of styles would need its own upkeep.

## Consequences
- The CSS is sent twice during a first load, in `<style>` and in the RSC payload, and it is not cached apart from the document. A returning visitor downloads it again.
- The flag is experimental and may change with a Next upgrade. `e2e/home.spec.ts` fails if the CSS stops being inlined.
- It works only in production builds, so `next dev` never shows it.
- Revisit if the CSS grows a lot, if returning visitors become common, or when the flag becomes stable or goes away.
- Local measurements do not decide questions of network behavior: repeat them on Vercel.
