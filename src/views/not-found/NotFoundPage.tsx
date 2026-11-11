import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { FC } from "react";

import { Link } from "@/shared/lib/i18n/navigation";

export const NotFoundPage: FC = async () => {
  const t = await getTranslations("Pages.NotFound");

  return (
    <main className="relative isolate flex grow flex-col items-center justify-center overflow-hidden px-5 pt-7 pb-10 text-center lg:px-10 lg:pt-10 lg:pb-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(var(--card-border)_1px,transparent_1px),linear-gradient(90deg,var(--card-border)_1px,transparent_1px)] bg-size-[40px_40px] bg-center opacity-35 [mask-image:radial-gradient(circle_at_50%_42%,#000_0,transparent_62%)] lg:bg-size-[64px_64px]"
      />
      <div
        data-not-found-code
        aria-hidden="true"
        className="mb-6 flex items-center justify-center gap-[.06em] text-[112px] leading-none font-extrabold tracking-[-0.06em] text-foreground select-none lg:mb-[34px] lg:text-[200px]"
      >
        <span>4</span>
        <span className="relative mx-[.04em] inline-block h-[.74em] w-[.6em] -rotate-6 rounded-[.16em] bg-brand shadow-[0_.08em_.16em_-.06em_rgba(0,0,0,.45)]">
          <span className="absolute top-1/2 left-1/2 h-1/2 w-[30%] -translate-1/2 rounded-[.06em] bg-background" />
          <span className="absolute -top-[.07em] -right-[.07em] size-[.13em] rounded-[.03em] bg-deco" />
        </span>
        <span>4</span>
      </div>
      <p className="mb-3.5 font-mono text-xs leading-none font-medium tracking-[0.12em] text-brand uppercase">
        {t("label")}
      </p>
      <h1 className="max-w-[620px] text-[27px] leading-[1.1] font-bold tracking-[-0.03em] text-balance lg:text-[40px]">
        {t("title")}
      </h1>
      <p className="mt-3.5 max-w-[480px] text-[15.5px] leading-[1.55] text-pretty text-foreground-soft lg:text-[17px]">
        {t("text")}
      </p>
      <Link
        href="/"
        className="mt-[26px] inline-flex h-[52px] items-center justify-center gap-2.5 self-stretch rounded-full bg-brand pr-[26px] pl-5 text-base font-bold text-background hover:shadow-[0_12px_26px_-14px_color-mix(in_srgb,var(--brand)_80%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:self-center lg:mt-[30px]"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-[18px]" strokeWidth={2.4} />
        {t("home")}
      </Link>
    </main>
  );
};
