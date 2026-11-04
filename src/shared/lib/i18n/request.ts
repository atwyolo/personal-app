import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { loadMergedMessages } from "./load-messages";
import { routing } from "./routing";

/**
 * Per-request i18n config (wired in next.config.ts). The locale is read from the root `[locale]` segment
 * through next/root-params, which keeps pages static with Cache Components.
 */
export default getRequestConfig(async (params) => {
  let { locale } = params;

  if (!locale) {
    const segment = await rootParams.locale();
    if (!hasLocale(routing.locales, segment)) notFound();
    locale = segment;
  }

  const messages = await loadMergedMessages(locale);

  // Without a zone next-intl uses the machine's, so a local and a Vercel build could print different dates.
  return { locale, messages, timeZone: "UTC" };
});
