import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getAboutPairs } from "@/db/queries/about";
import { getProfile } from "@/db/queries/home";
import { getInitials } from "@/shared/lib/initials";

import { InterviewPair } from "./ui/InterviewPair";

/** The conversation of the About page. No pairs is a valid state: the admin can delete them all, and the hero stays. */
export const Interview: FC = async () => {
  const locale = await getLocale();
  const [pairs, profile] = await Promise.all([getAboutPairs(locale), getProfile(locale)]);

  if (pairs.length === 0) return null;

  const initials = getInitials(profile.name);

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-[22px] px-3.5 pt-2 pb-10 lg:gap-7 lg:px-12 lg:pb-16">
      {pairs.map((pair) => (
        <InterviewPair key={pair.slug} pair={pair} initials={initials} />
      ))}
    </div>
  );
};
