import "server-only";

import { cacheLife } from "next/cache";

import type { Locale } from "@/shared/lib/locales";

import { loadLocalized } from "./localize";
import { byCodePoint } from "./order";
import { contentRoot, listSlugs } from "./read";
import { aboutPairSchema } from "./schemas";

export type AboutPair = {
  slug: string;
  linkText: string;
  questionTitle: string;
  questionMessage: string;
  answerTitle: string;
  answerMessage: string;
};

export const readAboutPairs = (root: string, locale: Locale): AboutPair[] =>
  listSlugs(root, "about")
    .map((slug) => loadLocalized({ root, locale, path: `about/${slug}.md`, schema: aboutPairSchema }))
    .sort((a, b) => a.sort - b.sort || byCodePoint(a.slug, b.slug))
    .map((pair) => ({
      slug: pair.slug,
      linkText: pair.linkText,
      questionTitle: pair.questionTitle,
      questionMessage: pair.questionMessage,
      answerTitle: pair.answerTitle,
      answerMessage: pair.body,
    }));

export async function getAboutPairs(locale: Locale): Promise<AboutPair[]> {
  "use cache";
  cacheLife("max");

  return readAboutPairs(contentRoot, locale);
}
