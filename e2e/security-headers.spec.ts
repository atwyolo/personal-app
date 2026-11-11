import { expect, test } from "./fixtures";

import { locales } from "@/shared/lib/locales";

const expectedHeaders = {
  "content-security-policy": /^default-src 'self'; script-src 'self' 'unsafe-inline';.*frame-ancestors 'none'/,
  "x-content-type-options": /^nosniff$/,
  "referrer-policy": /^strict-origin-when-cross-origin$/,
  "permissions-policy": /^camera=\(\), microphone=\(\), geolocation=\(\), browsing-topics=\(\)$/,
  "x-frame-options": /^DENY$/,
  "cross-origin-opener-policy": /^same-origin$/,
};

const expectSecurityHeaders = (headers: Record<string, string>, path: string) => {
  for (const [name, value] of Object.entries(expectedHeaders)) {
    expect(headers[name], `${name} on ${path}`).toMatch(value);
  }
};

test("sends the security headers on pages, the favicon and static assets", async ({ page, request }) => {
  const response = await page.goto("/en");
  expectSecurityHeaders(response!.headers(), "/en");

  expectSecurityHeaders((await request.get("/favicon.ico")).headers(), "/favicon.ico");

  const asset = await page.locator('script[src^="/_next/static/"]').first().getAttribute("src");
  expectSecurityHeaders((await request.get(asset!)).headers(), asset!);
});

for (const locale of locales) {
  for (const path of ["", "/about", "/experience", "/skills"]) {
    test(`/${locale}${path} runs without a CSP violation`, async ({ page }) => {
      await page.goto(`/${locale}${path}`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForLoadState("networkidle");
    });
  }
}

test("the header menus open without a CSP violation", async ({ page, isMobile }) => {
  await page.goto("/en");

  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    return;
  }

  await page.getByRole("button", { name: /EN/ }).click();
  await expect(page.getByRole("menuitemradio", { name: /English/ })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /theme/i }).click();
  await expect(page.getByRole("menuitemradio", { name: /System/ })).toBeVisible();
});
