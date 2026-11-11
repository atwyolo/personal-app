import { getLocale, getTranslations } from "next-intl/server";
import type { FC } from "react";

import { getExperience } from "@/content/experience";
import { ReadingProgress } from "@/features/reading-progress/ReadingProgress";
import { formatMonthYear, getDurationYears, getYearSpan } from "@/shared/lib/period";

import type { ExperienceJob } from "./experience-job";
import { ExperienceSection } from "./ui/ExperienceSection";
import { ExperienceBar } from "./ui/ExperienceBar";
import { ExperienceColumn } from "./ui/ExperienceColumn";

export const Experience: FC = async () => {
  const locale = await getLocale();
  const [experience, t] = await Promise.all([getExperience(locale), getTranslations("Pages.Experience")]);

  const jobs: ExperienceJob[] = experience.map((job) => {
    const { startDate, endDate, today } = job;
    const end = endDate ? formatMonthYear(endDate) : t("present");

    return {
      ...job,
      period: `${formatMonthYear(startDate)} – ${end}`,
      duration: t("duration", { years: getDurationYears(startDate, endDate, today) }),
    };
  });

  const span = getYearSpan(experience, experience[0]?.today ?? "");
  const title = span ? t("label", span) : t("labelWithoutYears");

  return (
    <ReadingProgress className="lg:grid lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] print:block">
      <ExperienceColumn title={title} jobs={jobs} />
      <div className="min-w-0">
        <ExperienceBar jobs={jobs} />
        {jobs.map((job, index) => (
          <ExperienceSection key={job.slug} job={job} priority={index === 0} />
        ))}
      </div>
    </ReadingProgress>
  );
};
