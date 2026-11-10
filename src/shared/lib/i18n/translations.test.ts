import { readFileSync } from "node:fs";
import path from "node:path";

import {
  isArgumentElement,
  isDateElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  type MessageFormatElement,
  parse,
} from "@formatjs/icu-messageformat-parser";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import { type Locale, locales } from "@/shared/lib/locales";

import { mergeMessages, type MessagesTree } from "./merge-messages";

const INHERITED = [
  "Pages.Common.LocaleMenu.names.*",
  "Pages.Common.Contacts.whatsapp",
  "Pages.Common.Contacts.linkedin",
  "Pages.Common.Contacts.pdf",
  "Pages.Common.Carousel.position",
  "Pages.Common.SkillRow.level",
];

const SAMPLES: Record<string, string | number> = {
  code: "DE",
  phone: "+1 555 0100",
  email: "a@b.dev",
  name: "React",
  query: "x",
  theme: "dark",
  current: 2,
  total: 2,
  shown: 2,
  level: 2,
  from: 2,
  to: 2,
};

const YEARS = [0.9, 1, 1.3, 2.5, 5, 21, 22, 25];

const read = (locale: Locale): MessagesTree =>
  JSON.parse(readFileSync(path.join(process.cwd(), "messages", `${locale}.json`), "utf8"));

const leaves = (tree: MessagesTree, prefix = ""): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) return leaves(value, name);

    return [[name, value ?? ""] as [string, string]];
  });

const isInherited = (key: string) =>
  INHERITED.some((pattern) => (pattern.endsWith(".*") ? key.startsWith(pattern.slice(0, -1)) : key === pattern));

const argumentsOf = (elements: MessageFormatElement[], found = new Set<string>()): Set<string> => {
  for (const element of elements) {
    const named =
      isArgumentElement(element) ||
      isNumberElement(element) ||
      isDateElement(element) ||
      isTimeElement(element) ||
      isSelectElement(element) ||
      isPluralElement(element);
    if (named) found.add(element.value);
    if (isSelectElement(element) || isPluralElement(element)) {
      for (const option of Object.values(element.options)) argumentsOf(option.value, found);
    }
    if (isTagElement(element)) argumentsOf(element.children, found);
  }

  return found;
};

const pluralsOf = (elements: MessageFormatElement[]): string[][] =>
  elements.flatMap((element) => {
    if (isPluralElement(element)) {
      return [Object.keys(element.options), ...Object.values(element.options).flatMap((option) => pluralsOf(option.value))];
    }
    if (isSelectElement(element)) return Object.values(element.options).flatMap((option) => pluralsOf(option.value));
    if (isTagElement(element)) return pluralsOf(element.children);

    return [];
  });

const selectsOf = (elements: MessageFormatElement[], found: string[] = []): string[] => {
  for (const element of elements) {
    if (isSelectElement(element)) found.push(`${element.value}: ${Object.keys(element.options).sort().join(" ")}`);
    if (isSelectElement(element) || isPluralElement(element)) {
      for (const option of Object.values(element.options)) selectsOf(option.value, found);
    }
    if (isTagElement(element)) selectsOf(element.children, found);
  }

  return found.sort();
};

const neededCategories = (locale: Locale): string[] => {
  const rules = new Intl.PluralRules(locale);
  const categories = new Set<string>(["other"]);
  for (let tenths = 0; tenths <= 1000; tenths++) categories.add(rules.select(tenths / 10));

  return [...categories];
};

const messagesFor = (locale: Locale) =>
  createTranslator({
    locale,
    messages: mergeMessages(read("en"), read(locale)),
    onError: (error) => {
      throw error;
    },
  }) as unknown as (key: string, values?: Record<string, string | number>) => string;

const english = new Map(leaves(read("en")));

describe.each(locales.filter((locale) => locale !== "en"))("translations into %s", (locale) => {
  const translated = new Map(leaves(read(locale)));

  it("has no keys English lacks", () => {
    expect([...translated.keys()].filter((key) => !english.has(key))).toEqual([]);
  });

  it("translates every key except the inherited ones", () => {
    expect([...english.keys()].filter((key) => !isInherited(key) && !translated.get(key))).toEqual([]);
  });

  it("leaves the inherited keys to English", () => {
    expect([...translated.keys()].filter(isInherited)).toEqual([]);
  });

  it("writes every message as valid ICU", () => {
    const broken = [...translated].filter(([, message]) => {
      try {
        parse(message);
        return false;
      } catch {
        return true;
      }
    });

    expect(broken.map(([key]) => key)).toEqual([]);
  });

  it("uses the arguments of English in every message", () => {
    const differ = [...translated].filter(([key, message]) => {
      const expected = [...argumentsOf(parse(english.get(key) ?? ""))].sort();
      const actual = [...argumentsOf(parse(message))].sort();

      return expected.join() !== actual.join();
    });

    expect(differ.map(([key]) => key)).toEqual([]);
  });

  it("keeps the select branches of English", () => {
    const differ = [...translated].filter(
      ([key, message]) => selectsOf(parse(english.get(key) ?? "")).join() !== selectsOf(parse(message)).join(),
    );

    expect(differ.map(([key]) => key)).toEqual([]);
  });

  it("covers every plural form the language needs", () => {
    const needed = neededCategories(locale);
    const gaps = [...translated].flatMap(([key, message]) =>
      pluralsOf(parse(message)).flatMap((options) =>
        needed.filter((category) => !options.includes(category)).map((category) => `${key}: ${category}`),
      ),
    );

    expect(gaps).toEqual([]);
  });

  it("formats every message with sample values", () => {
    const t = messagesFor(locale);
    const failures = [...english.keys()].flatMap((key) => {
      const runs = YEARS.map((years) => ({ ...SAMPLES, years }));
      return runs.flatMap((values) => {
        try {
          t(key, values);
          return [];
        } catch (error) {
          return [`${key}: ${(error as Error).message}`];
        }
      });
    });

    expect(failures).toEqual([]);
  });
});

describe("plural forms", () => {
  it.each([
    ["ru", 1.3, "1,3 года"],
    ["ru", 21, "21 год"],
    ["ru", 22, "22 года"],
    ["ru", 25, "25 лет"],
    ["pl", 1, "1 rok"],
    ["pl", 2.5, "2,5 roku"],
    ["pl", 22, "22 lata"],
    ["pl", 25, "25 lat"],
    ["fr", 1.5, "1,5 an"],
    ["de", 2.5, "2,5 Jahre"],
    ["ja", 3, "3年"],
  ] as const)("%s formats %s years as %s", (locale, years, text) => {
    expect(messagesFor(locale)("Pages.Home.experience.duration", { years })).toBe(text);
  });
});

describe("French typography", () => {
  it("puts a no-break space before the colon", () => {
    expect(new Map(leaves(read("fr"))).get("Pages.Common.LocaleMenu.triggerAria")).toBe("Langue : {code}");
  });
});
