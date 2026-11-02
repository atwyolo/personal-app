import type { FC } from "react";

import { getJobAttributes, type ProjectJob } from "../project-job";

interface ProjectsBarProps {
  jobs: ProjectJob[];
}

/** The phone's sticky bar: the job being read and a segment of progress per job. It repeats the articles, so it is hidden from screen readers. */
export const ProjectsBar: FC<ProjectsBarProps> = (props) => {
  const { jobs } = props;

  if (jobs.length === 0) return null;

  return (
    <div
      data-projects-bar
      aria-hidden
      className="sticky top-16 z-[5] flex flex-col gap-2 border-b border-card-border bg-card px-4 pt-2.5 pb-3 lg:hidden print:hidden"
    >
      <div className="grid">
        {jobs.map((job, index) => (
          <div
            key={job.slug}
            {...getJobAttributes(index)}
            className="col-start-1 row-start-1 flex translate-y-2 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 opacity-0 [transition:opacity_.3s,translate_.35s] data-active:translate-y-0 data-active:opacity-100 motion-reduce:transition-none"
          >
            <span className="text-[17px] font-semibold tracking-[-0.02em]">{job.company}</span>
            <span className="font-mono text-xs tracking-[0.04em] whitespace-nowrap text-muted-foreground">
              {job.period}
            </span>
          </div>
        ))}
      </div>
      <div className="grid auto-cols-fr grid-flow-col gap-1">
        {jobs.map((job, index) => (
          <span
            key={job.slug}
            data-segment
            data-job={index}
            className="h-[3px] overflow-hidden rounded-[2px] bg-border"
          >
            <span className="block h-full origin-left scale-x-[var(--progress,0)] bg-brand" />
          </span>
        ))}
      </div>
    </div>
  );
};
