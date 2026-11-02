import type { FC } from "react";

import { AboutHero } from "@/widgets/about-hero/AboutHero";
import { Interview } from "@/widgets/interview/Interview";

export const AboutPage: FC = () => {
  return (
    <main className="w-full">
      <AboutHero />
      <Interview />
    </main>
  );
};
