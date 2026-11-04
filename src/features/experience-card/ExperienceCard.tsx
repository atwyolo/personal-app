import { useTranslations } from "next-intl";
import type { FC } from "react";

import type { ExperienceEntry } from "@/content/experience";
import { formatMonthYear, getDurationYears } from "@/shared/lib/period";
import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/Chip";
import { Image } from "@/shared/ui/Image";
import { Link } from "@/shared/ui/Link";
import { Tile } from "@/shared/ui/Tile";

interface ExperienceCardProps {
  job: ExperienceEntry;
  className?: string;
}

/**
 * One job: image, company, period with its duration, description, skills. Synchronous, so Vitest can render it.
 * `sizes` is the rendered image width, not the box width: the column minus the card's border and padding (359px at
 * 1280), but in a box narrower than 16:9 `object-cover` scales the file by the 180px height, so desktop takes at least
 * 320px. Below `lg` the box is wider than 16:9 and its width decides.
 */
export const ExperienceCard: FC<ExperienceCardProps> = (props) => {
  const { job, className } = props;
  const { slug, company, startDate, endDate, today, imageUrl, descriptionShort, skills } = job;
  const t = useTranslations("Pages.Home.experience");

  const end = endDate ? formatMonthYear(endDate) : t("present");
  const duration = t("duration", { years: getDurationYears(startDate, endDate, today) });

  return (
    <Tile as="article" className={cn("p-3 lg:p-3.5", className)}>
      <div className="relative h-35 lg:h-45">
        <Image
          src={imageUrl}
          alt={company}
          sizes="(min-width: 1024px) max(320px, 33.33vw - 67px), (min-width: 720px) 662px, calc(100vw - 58px)"
          className="object-cover"
          framed
        />
      </div>
      <div className="flex grow flex-col gap-2 px-1 pt-1 pb-0.5 lg:px-1.5 lg:pt-1.5 lg:pb-1">
        <h3 className="text-lg font-semibold lg:text-xl">{company}</h3>
        <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase lg:text-xs">
          {formatMonthYear(startDate)} – {end} · <span className="whitespace-nowrap">{duration}</span>
        </p>
        <p className="text-sm leading-normal text-foreground-soft">{descriptionShort}</p>
        {skills.length > 0 && (
          <ul className="mt-0.5 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <li key={skill}>
                <Chip>{skill}</Chip>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/experience#${slug}`} showArrowIcon className="mt-auto self-start py-1 text-[15px]">
          {t("learnMore")}
        </Link>
      </div>
    </Tile>
  );
};
