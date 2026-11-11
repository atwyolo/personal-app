import type { Locale } from "@/shared/lib/locales";

export type JsonLd = Record<string, unknown>;

export const serializeJsonLd = (data: object): string => JSON.stringify(data).replace(/</g, "\\u003c");

const siteRoot = (base: URL): string => new URL("/", base).href;

export const personId = (base: URL): string => `${siteRoot(base)}#person`;

interface BuildPersonJsonLdParams {
  base: URL;
  name: string;
  englishName: string;
  jobTitle: string;
  photoUrl: string | null;
  linkedinUrl: string;
}

export const buildPersonJsonLd = (params: BuildPersonJsonLdParams): JsonLd => {
  const { base, name, englishName, jobTitle, photoUrl, linkedinUrl } = params;

  return {
    "@type": "Person",
    "@id": personId(base),
    name,
    ...(englishName !== name ? { alternateName: englishName } : {}),
    jobTitle,
    url: siteRoot(base),
    ...(photoUrl ? { image: photoUrl } : {}),
    sameAs: [linkedinUrl],
  };
};

interface BuildHomeJsonLdParams {
  person: JsonLd;
  siteName: string;
  locale: Locale;
  base: URL;
}

export const buildHomeJsonLd = (params: BuildHomeJsonLdParams): JsonLd => {
  const { person, siteName, locale, base } = params;

  return {
    "@context": "https://schema.org",
    "@graph": [{ "@type": "WebSite", name: siteName, url: siteRoot(base), inLanguage: locale }, person],
  };
};
