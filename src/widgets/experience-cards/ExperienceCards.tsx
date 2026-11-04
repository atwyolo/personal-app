import { getLocale, getTranslations } from "next-intl/server";
import type { FC } from "react";

import { getExperience } from "@/content/experience";
import { ExperienceCard } from "@/features/experience-card/ExperienceCard";
import { ButtonLink } from "@/shared/ui/ButtonLink";
import { Carousel } from "@/shared/ui/Carousel";
import { SectionHeader } from "@/shared/ui/SectionHeader";

/** Home's Experience block: the jobs as cards in their `sort` order, then the way to the Experience page. */
export const ExperienceCards: FC = async () => {
  const locale = await getLocale();
  const [jobs, t] = await Promise.all([getExperience(locale), getTranslations("Pages.Home.experience")]);

  return (
    <section aria-labelledby="experience-title" className="flex flex-col gap-3 lg:gap-4">
      <SectionHeader id="experience-title">{t("label")}</SectionHeader>
      <Carousel label={t("label")} className="lg:grid-cols-3">
        {jobs.map((job, index) => (
          <ExperienceCard key={job.slug} job={job} className={index % 2 ? "reveal reveal-left" : "reveal"} />
        ))}
      </Carousel>
      <ButtonLink href="/experience" tone="primary" className="lg:self-end">
        {t("all")}
      </ButtonLink>
    </section>
  );
};
