import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getSiteMeta } from "@/content/meta";
import { getProfile } from "@/content/profile";
import { buildHomeJsonLd, buildPersonJsonLd, serializeJsonLd } from "@/shared/lib/json-ld";
import { siteUrl } from "@/shared/lib/site-url";

import { About } from "@/widgets/about/About";
import { Contacts } from "@/widgets/contacts/Contacts";
import { ExperienceCards } from "@/widgets/experience-cards/ExperienceCards";
import { Hero } from "@/widgets/hero/Hero";
import { ProfilePhoto } from "@/widgets/profile-photo/ProfilePhoto";
import { TopSkills } from "@/widgets/top-skills/TopSkills";

export const HomePage: FC = async () => {
  const locale = await getLocale();
  const [profile, englishProfile, site] = await Promise.all([getProfile(locale), getProfile("en"), getSiteMeta(locale)]);

  const person = buildPersonJsonLd({
    base: siteUrl,
    name: profile.name,
    englishName: englishProfile.name,
    jobTitle: profile.jobTitle,
    photoUrl: profile.photoUrl,
    linkedinUrl: profile.contacts.linkedin.href,
  });
  const jsonLd = buildHomeJsonLd({ person, siteName: site.siteName, locale, base: siteUrl });

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-3 px-4 pt-4 pb-8 lg:max-w-none lg:gap-4 lg:pr-15 lg:pl-5 lg:pt-6 lg:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="grid grid-cols-2 gap-3 [grid-template-areas:'hero_hero'_'photo_photo'_'contacts_contacts'_'about_about'] lg:grid-cols-4 lg:gap-4 lg:[grid-template-areas:'photo_hero_hero_hero'_'photo_about_about_about'_'contacts_about_about_about']">
        <Hero className="reveal [grid-area:hero]" />
        <ProfilePhoto className="reveal reveal-left [grid-area:photo]" />
        <Contacts className="[grid-area:contacts]" />
        <About className="reveal [grid-area:about]" />
      </div>

      <ExperienceCards />

      <TopSkills />
    </main>
  );
};
