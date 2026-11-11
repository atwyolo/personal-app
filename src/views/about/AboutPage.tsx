import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/content/profile";
import { buildPersonJsonLd, serializeJsonLd } from "@/shared/lib/json-ld";
import { siteUrl } from "@/shared/lib/site-url";
import { AboutHero } from "@/widgets/about-hero/AboutHero";
import { Interview } from "@/widgets/interview/Interview";

export const AboutPage: FC = async () => {
  const [profile, englishProfile] = await Promise.all([getProfile(await getLocale()), getProfile("en")]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: buildPersonJsonLd({
      base: siteUrl,
      name: profile.name,
      englishName: englishProfile.name,
      jobTitle: profile.jobTitle,
      photoUrl: profile.photoUrl,
      linkedinUrl: profile.contacts.linkedin.href,
    }),
  };

  return (
    <main className="w-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <AboutHero />
      <Interview />
    </main>
  );
};
