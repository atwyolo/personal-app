import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/content/profile";
import { serializeJsonLd } from "@/shared/lib/json-ld";
import { AboutHero } from "@/widgets/about-hero/AboutHero";
import { Interview } from "@/widgets/interview/Interview";

export const AboutPage: FC = async () => {
  const profile = await getProfile(await getLocale());

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.jobTitle,
      sameAs: [profile.contacts.linkedin.href],
    },
  };

  return (
    <main className="w-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <AboutHero />
      <Interview />
    </main>
  );
};
