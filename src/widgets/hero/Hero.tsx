import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/content/profile";
import { cn } from "@/shared/lib/utils";
import { Chip } from "@/shared/ui/Chip";
import { Tile } from "@/shared/ui/Tile";

interface HeroProps {
  /** Grid placement from the page. */
  className?: string;
}

/**
 * First tile of the home page: name (the page's only h1), headline and the hero skills.
 * Reads the profile itself: getProfile is a "use cache" function, so the header, hero and contacts share one result.
 */
export const Hero: FC<HeroProps> = async (props) => {
  const { className } = props;
  const locale = await getLocale();
  const profile = await getProfile(locale);

  return (
    <Tile as="section" aria-labelledby="hero-title" className={cn("gap-3 p-5 lg:gap-3.5 lg:p-9", className)}>
      <h1
        id="hero-title"
        className="text-4xl leading-none font-bold tracking-[-0.04em] lg:text-[64px] lg:leading-[0.95] lg:tracking-[-0.045em]"
      >
        {profile.name}
      </h1>
      <p className="text-base leading-[1.4] text-foreground-soft lg:text-xl">{profile.headline}</p>
      <ul className="flex flex-wrap gap-1.5 lg:pt-1">
        {profile.heroSkills.map((skill) => (
          <li key={skill}>
            <Chip>{skill}</Chip>
          </li>
        ))}
      </ul>
    </Tile>
  );
};
