import { getLocale, getTranslations } from "next-intl/server";
import type { FC } from "react";

import { getAboutPairs } from "@/content/about";
import { getProfile } from "@/content/profile";
import { InterviewReveal } from "@/features/interview-reveal/InterviewReveal";
import { QuestionNav } from "@/features/question-nav/QuestionNav";
import { getInitials } from "@/shared/lib/initials";

import { InterviewPair } from "./ui/InterviewPair";

export const Interview: FC = async () => {
  const locale = await getLocale();
  const [pairs, profile, t] = await Promise.all([
    getAboutPairs(locale),
    getProfile(locale),
    getTranslations("Pages.About"),
  ]);

  if (pairs.length === 0) return null;

  const initials = getInitials(profile.name);

  return (
    <div>
      <QuestionNav
        label={t("questionsNav")}
        items={pairs.map((pair) => ({ slug: pair.slug, linkText: pair.linkText }))}
      />
      <InterviewReveal className="mx-auto flex w-full max-w-[820px] flex-col gap-[22px] px-3.5 pt-2 pb-10 lg:gap-7 lg:px-12 lg:pb-16">
        {pairs.map((pair) => (
          <InterviewPair key={pair.slug} pair={pair} initials={initials} />
        ))}
      </InterviewReveal>
    </div>
  );
};
