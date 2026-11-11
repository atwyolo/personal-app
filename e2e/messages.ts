import { readFileSync } from "node:fs";
import path from "node:path";

import { createTranslator } from "next-intl";

import { mergeMessages, type MessagesTree } from "@/shared/lib/i18n/merge-messages";
import type { Locale } from "@/shared/lib/locales";

export type Translate = (key: string, values?: Record<string, string | number>) => string;

const read = (locale: Locale): MessagesTree =>
  JSON.parse(readFileSync(path.join(process.cwd(), "messages", `${locale}.json`), "utf8"));

export const messagesFor = (locale: Locale): Translate => {
  const messages = locale === "en" ? read("en") : mergeMessages(read("en"), read(locale));
  const t = createTranslator({ locale, messages }) as unknown as Translate;

  return (key, values) => t(key, values);
};
