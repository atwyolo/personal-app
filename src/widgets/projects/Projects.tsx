import { getLocale, getTranslations } from "next-intl/server";
import type { FC } from "react";

import { getExperience } from "@/content/experience";
import { ReadingProgress } from "@/features/reading-progress/ReadingProgress";
import { formatMonthYear, getDurationYears, getYearSpan } from "@/shared/lib/period";

import type { ProjectJob } from "./project-job";
import { ProjectSection } from "./ui/ProjectSection";
import { ProjectsBar } from "./ui/ProjectsBar";
import { ProjectsColumn } from "./ui/ProjectsColumn";

/**
 * The work history: a pinned column on desktop and a sticky bar on phones, both following the articles.
 * No jobs is a valid state: the experience folder may be emptied, and the Back link and the heading stay.
 */
export const Projects: FC = async () => {
  const locale = await getLocale();
  const [experience, t] = await Promise.all([getExperience(locale), getTranslations("Pages.Experience")]);

  const jobs: ProjectJob[] = experience.map((job) => {
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
      <ProjectsColumn title={title} jobs={jobs} />
      <div className="min-w-0">
        <ProjectsBar jobs={jobs} />
        {jobs.map((job) => (
          <ProjectSection key={job.slug} job={job} />
        ))}
      </div>
    </ReadingProgress>
  );
};
