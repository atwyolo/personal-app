import { useTranslations } from "next-intl";
import type { FC } from "react";

import { Link } from "@/shared/lib/i18n/navigation";
import { BackLink } from "@/shared/ui/BackLink";
import { Image } from "@/shared/ui/Image";

import { getJobAttributes, type ProjectJob } from "../project-job";

interface ProjectsColumnProps {
  title: string;
  jobs: ProjectJob[];
}

/**
 * The pinned left column. Never `display: none`, because the `h1` must exist on phones, where this column is only the
 * row of the Back link. A `<div>`, not an `<aside>`: a page heading does not belong in a complementary landmark.
 */
export const ProjectsColumn: FC<ProjectsColumnProps> = (props) => {
  const { title, jobs } = props;
  const t = useTranslations("Pages.Experience");
  const common = useTranslations("Pages.Common");

  return (
    <div
      data-projects-column
      className="px-[18px] pt-3 lg:sticky lg:top-[73px] lg:flex lg:h-[calc(100dvh-73px)] lg:flex-col lg:border-r lg:border-card-border lg:bg-card lg:pt-10 lg:pr-10 lg:pb-8 lg:pl-12 print:hidden"
    >
      <BackLink label={common("back")} />
      <h1 className="sr-only font-mono text-xs leading-none font-normal tracking-[0.08em] text-muted-foreground uppercase lg:not-sr-only">
        {title}
      </h1>

      {jobs.length > 0 && (
        <>
          {/*
            The articles say all of this; here it is decoration. One grid cell keeps the height of the tallest block.
            Clipped, because in a short window the blocks must not cover the rows. The row is limited to the free height,
            so there the image shrinks first and the name stays whole. Below 640 px it would be a sliver, so it goes.
          */}
          <div
            data-projects-stage
            aria-hidden
            className="mt-5 hidden min-h-0 grow lg:grid lg:grid-rows-[minmax(0,1fr)] lg:overflow-clip"
          >
            {jobs.map((job, index) => (
              <div
                key={job.slug}
                {...getJobAttributes(index)}
                className="col-start-1 row-start-1 flex min-h-0 translate-y-6 flex-col justify-center gap-3.5 opacity-0 [transition:opacity_.45s_ease,translate_.55s_cubic-bezier(.2,.7,.2,1)] data-active:translate-y-0 data-active:opacity-100 motion-reduce:transition-none"
              >
                <div className="relative h-[200px] min-h-0 overflow-hidden rounded-2xl [@media(max-height:639px)]:hidden">
                  <Image src={job.imageUrl} alt={job.company} sizes="calc(45vw - 89px)" className="object-cover" framed />
                </div>
                <span className="shrink-0 text-[54px] leading-[.95] font-bold tracking-[-0.04em]">{job.company}</span>
                <span className="shrink-0 font-mono text-[13px] tracking-[0.04em] text-muted-foreground">
                  {job.role ? `${job.role} · ${job.duration}` : job.duration}
                </span>
              </div>
            ))}
          </div>

          <nav aria-label={t("navLabel")} className="mt-5 hidden flex-col gap-0.5 lg:flex">
            {jobs.map((job, index) => (
              <Link
                key={job.slug}
                href={`#${job.slug}`}
                replace
                scroll={false}
                {...getJobAttributes(index)}
                aria-current={index === 0 ? "true" : undefined}
                className="group grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2.5 text-sm text-muted-foreground transition-colors data-active:text-foreground"
              >
                <span className="font-mono text-xs leading-none font-medium group-data-active:text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{job.company}</span>
                <span className="font-mono text-xs leading-none font-medium">{job.period}</span>
                <span aria-hidden className="col-span-full h-[3px] overflow-hidden rounded-[2px] bg-border">
                  <span className="block h-full origin-left scale-x-[var(--progress,0)] bg-brand" />
                </span>
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
};
