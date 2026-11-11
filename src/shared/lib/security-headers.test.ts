import { describe, expect, it } from "vitest";

import { buildSecurityHeaders } from "./security-headers";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://5iyco5bcxydlbyja.public.blob.vercel-storage.com",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const asRecord = (development: boolean) =>
  Object.fromEntries(buildSecurityHeaders({ development }).map(({ key, value }) => [key, value]));

describe("buildSecurityHeaders", () => {
  it("sets the six headers", () => {
    expect(asRecord(false)).toEqual({
      "Content-Security-Policy": csp,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
      "X-Frame-Options": "DENY",
      "Cross-Origin-Opener-Policy": "same-origin",
    });
  });

  it("adds 'unsafe-eval' to script-src only in development", () => {
    expect(asRecord(true)["Content-Security-Policy"]).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval';");
    expect(asRecord(false)["Content-Security-Policy"]).not.toContain("unsafe-eval");
  });

  it("does not upgrade insecure requests, so next start over http keeps working", () => {
    expect(asRecord(false)["Content-Security-Policy"]).not.toContain("upgrade-insecure-requests");
  });
});
