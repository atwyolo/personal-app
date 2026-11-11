import { beforeEach, describe, expect, it, vi } from "vitest";

import getConfig from "./request";

const root = vi.hoisted(() => ({ locale: undefined as string | undefined }));
const navigation = vi.hoisted(() => ({ notFound: vi.fn() }));

vi.mock("next-intl/server", () => ({ getRequestConfig: (factory: unknown) => factory }));
vi.mock("next/root-params", () => ({ locale: async () => root.locale }));
vi.mock("next/navigation", () => navigation);
vi.mock("./routing", () => ({ routing: { locales: ["en", "ru", "de"], defaultLocale: "en" } }));
vi.mock("./load-messages", () => ({ loadMergedMessages: async () => ({}) }));

interface ConfigParams {
  locale?: string;
  requestLocale: Promise<string | undefined>;
}

const config = getConfig as unknown as (params: ConfigParams) => Promise<{ locale: string; timeZone: string }>;

describe("request config", () => {
  beforeEach(() => {
    root.locale = undefined;
    navigation.notFound.mockClear();
  });

  it("formats dates in UTC, so a local and a Vercel build print the same day", async () => {
    const { timeZone } = await config({ locale: "en", requestLocale: Promise.resolve(undefined) });

    expect(timeZone).toBe("UTC");
  });

  it("takes the locale of the root segment without reading the request", async () => {
    root.locale = "de";
    const requestLocale = vi.fn(async () => "ru");

    const { locale } = await config({
      get requestLocale() {
        return requestLocale();
      },
    });

    expect(locale).toBe("de");
    expect(requestLocale).not.toHaveBeenCalled();
  });

  it("takes the locale of the request outside the locale segment, as on the global 404", async () => {
    const { locale } = await config({ requestLocale: Promise.resolve("ru") });

    expect(locale).toBe("ru");
  });

  it("falls back to English for an unsupported request locale instead of a 404", async () => {
    const { locale } = await config({ requestLocale: Promise.resolve("xx") });

    expect(locale).toBe("en");
    expect(navigation.notFound).not.toHaveBeenCalled();
  });

  it("is a 404 for an unsupported locale segment", async () => {
    root.locale = "wp-login.php";

    await config({ requestLocale: Promise.resolve(undefined) });

    expect(navigation.notFound).toHaveBeenCalled();
  });
});
