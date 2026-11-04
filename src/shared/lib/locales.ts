/**
 * Supported locales. Single source for next-intl routing and the content folders (`messages/<locale>/`).
 * `en` is the default and the fallback: its translation rows are always complete.
 */
export const locales = ["en", "ru", "pt", "es", "de", "fr", "ja", "pl"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
