import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { mergeMessages, type MessagesTree } from "@/shared/lib/i18n/merge-messages";
import { locales } from "@/shared/lib/locales";

import { errorTexts, getErrorLocale } from "./error-texts";

const read = (locale: string): MessagesTree =>
  JSON.parse(readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8"));

describe("errorTexts", () => {
  it.each(locales)("matches Pages.Error of messages/%s.json", (locale) => {
    const messages = locale === "en" ? read("en") : mergeMessages(read("en"), read(locale));
    const pages = messages.Pages as MessagesTree;

    expect(errorTexts[locale]).toEqual(pages.Error);
  });
});

describe("getErrorLocale", () => {
  it.each([
    ["/ru/about", "ru"],
    ["/de", "de"],
    ["/ja/skills/", "ja"],
    ["/xx/a", "en"],
    ["/wp-login.php", "en"],
    ["/", "en"],
    ["", "en"],
  ])("reads %s as %s", (pathname, locale) => {
    expect(getErrorLocale(pathname)).toBe(locale);
  });
});
