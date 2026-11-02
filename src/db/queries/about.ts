import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { aboutPairTranslations, aboutPairs } from "@/db/schema";
import type { Locale } from "@/shared/lib/locales";
import type { RichTextDoc } from "@/shared/lib/rich-text";
import { localized } from "./localized";

/** About page data, cached like the home page: see `src/db/queries/home.ts`. */
export const aboutCacheTags = {
  pairs: "about",
} as const;

export type AboutPair = {
  slug: string;
  linkText: string;
  questionTitle: string;
  questionMessage: string;
  answerTitle: string;
  answerMessage: RichTextDoc;
};

export async function getAboutPairs(locale: Locale): Promise<AboutPair[]> {
  "use cache";
  cacheLife("max");
  cacheTag(aboutCacheTags.pairs);

  const tr = alias(aboutPairTranslations, "tr");
  const en = alias(aboutPairTranslations, "en");

  return db
    .select({
      slug: aboutPairs.slug,
      linkText: localized(tr.linkText, en.linkText),
      questionTitle: localized(tr.questionTitle, en.questionTitle),
      questionMessage: localized(tr.questionMessage, en.questionMessage),
      answerTitle: localized(tr.answerTitle, en.answerTitle),
      answerMessage: localized(tr.answerMessage, en.answerMessage),
    })
    .from(aboutPairs)
    .innerJoin(en, and(eq(en.aboutPairId, aboutPairs.id), eq(en.locale, "en")))
    .leftJoin(tr, and(eq(tr.aboutPairId, aboutPairs.id), eq(tr.locale, locale)))
    .orderBy(asc(aboutPairs.sort), asc(aboutPairs.id));
}
