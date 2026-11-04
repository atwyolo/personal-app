import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { loadMergedMessages } from "./load-messages";
import { routing } from "./routing";

export default getRequestConfig(async (params) => {
  let { locale } = params;

  if (!locale) {
    const segment = await rootParams.locale();
    if (!hasLocale(routing.locales, segment)) notFound();
    locale = segment;
  }

  const messages = await loadMergedMessages(locale);

  return { locale, messages, timeZone: "UTC" };
});
