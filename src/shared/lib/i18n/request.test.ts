import { describe, expect, it, vi } from "vitest";
import getConfig from "./request";

vi.mock("next-intl/server", () => ({ getRequestConfig: (factory: unknown) => factory }));
vi.mock("next/root-params", () => ({ locale: async () => "en" }));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
vi.mock("./routing", () => ({ routing: { locales: ["en"], defaultLocale: "en" } }));

describe("request config", () => {
  it("formats dates in UTC, so a local and a Vercel build print the same day", async () => {
    const config = await (getConfig as unknown as (params: { locale: string }) => Promise<{ timeZone: string }>)({
      locale: "en",
    });

    expect(config.timeZone).toBe("UTC");
  });
});
