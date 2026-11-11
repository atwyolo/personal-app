import type { Locale } from "@/shared/lib/locales";

import { mergeMessages, type MessagesTree } from "./merge-messages";
import { routing } from "./routing";

export const loadMessages = async (locale: Locale): Promise<MessagesTree> =>
  (await import(`../../../../messages/${locale}.json`)).default;

export const loadMergedMessages = async (locale: Locale): Promise<MessagesTree> => {
  const fallback = await loadMessages(routing.defaultLocale);

  return locale === routing.defaultLocale ? fallback : mergeMessages(fallback, await loadMessages(locale));
};
