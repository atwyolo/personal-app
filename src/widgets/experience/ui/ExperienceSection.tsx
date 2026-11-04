import { useTranslations } from "next-intl";
import type { FC } from "react";

import { Chip } from "@/shared/ui/Chip";
import { Image } from "@/shared/ui/Image";
import { Markdown } from "@/shared/ui/Markdown";

import type { ExperienceJob } from "../experience-job";

interface ExperienceSectionProps {
  job: ExperienceJob;
}

/**
 * One job. The margin clears the header and the phone's bar; when the bar wraps to two lines, the top padding covers the
 * difference. `tabIndex` lets a row move the focus here.
 * From `lg` the image moves to the stage of the left column. CSS cannot carry one element between the two places, so
 * there are two copies, and the hidden one is never fetched: a lazy image with `display: none` does not load.
 */
export const ExperienceSection: FC<ExperienceSectionProps> = (props) => {
  const { job } = props;
  const { slug, company, role, period, duration, imageUrl, descriptionShort, descriptionFull, skills } = job;
  const t = useTranslations("Pages.Experience");

  return (
    <article
      id={slug}
      tabIndex={-1}
      className="flex scroll-mt-[120px] flex-col gap-3 border-b border-card-border px-[18px] pt-7 pb-9 [overflow-wrap:anywhere] outline-none lg:min-h-[95dvh] lg:scroll-mt-[73px] lg:gap-4 lg:px-14 lg:pt-14 lg:pb-16 print:min-h-0"
    >
      <h2 className="text-[30px] leading-[1.1] font-bold tracking-[-0.03em] lg:text-[34px]">{company}</h2>
      <p className="font-mono text-[13px] leading-[1.5] tracking-[0.04em] text-muted-foreground">
        {role && `${role} · `}
        {period} · <span className="whitespace-nowrap">{duration}</span>
      </p>
      <div className="relative h-[130px] overflow-hidden rounded-2xl lg:hidden print:block">
        <Image
          src={imageUrl}
          alt={company}
          sizes="calc(100vw - 36px)"
          className="object-cover"
          framed
        />
      </div>
      <p className="text-base leading-[1.6] text-foreground-soft">{descriptionShort}</p>
      {descriptionFull && (
        <Markdown source={descriptionFull} headingOffset={2} className="text-base leading-[1.6] text-foreground-soft" />
      )}
      {skills.length > 0 && (
        <>
          <h3 className="mt-2 font-mono text-[13px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {t("skills")}
          </h3>
          <ul data-skills className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <li key={skill}>
                <Chip>{skill}</Chip>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
};
