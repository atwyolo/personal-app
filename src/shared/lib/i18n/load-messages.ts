import type { Locale } from "@/shared/lib/locales";

import { mergeMessages, type MessagesTree } from "./merge-messages";
import { routing } from "./routing";

/** One locale's file as it is. Relative path: messages/ lives in the repository root, outside the `@/*` alias. */
export const loadMessages = async (locale: Locale): Promise<MessagesTree> =>
  (await import(`../../../../messages/${locale}.json`)).default;

/** A locale's messages merged over English, which is complete: what next-intl and the metadata read. */
export const loadMergedMessages = async (locale: Locale): Promise<MessagesTree> => {
  const fallback = await loadMessages(routing.defaultLocale);

  return locale === routing.defaultLocale ? fallback : mergeMessages(fallback, await loadMessages(locale));
};
