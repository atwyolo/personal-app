---
tags: [adr, performance, privacy]
status: deferred
date: 2026-11-11
---

# ADR-0021 Real User Monitoring

## Context

Lighthouse gives lab numbers from one simulated device. Real-user monitoring (RUM) measures the Core Web Vitals of real visitors. Vercel Speed Insights does it with a small client script: free on Hobby (10,000 events over 30 days), no cookie, data not tied to a visitor or an IP; its script and endpoint live under `/_vercel/` on the site's own origin. Google's field data (CrUX) needs more traffic than a portfolio gets, so PageSpeed Insights shows none for it.

## Decision

Deferred (owner, 2026-11-11): no Speed Insights for now. A portfolio's small traffic gives a p75 that jumps with every slow phone, and the owner declined analytics before.

## Alternatives

- **Speed Insights now:** real metrics at no cost, one client component in the root layout and a package.
- **Own reporting through `useReportWebVitals`:** needs an endpoint and storage the site does not have.

## Consequences

- Performance is judged by Lighthouse on previews and production only.
- Enabling it later: `@vercel/speed-insights`, `<SpeedInsights />` in the root layout, the switch in the dashboard. The CSP of [[ADR-0019 Security Headers]] already covers it (same origin).
