"use client";

import { ChevronDownIcon } from "lucide-react";
import { hasLocale, useLocale, useTranslations } from "next-intl";
import type { FC } from "react";

import { usePathname, useRouter } from "@/shared/lib/i18n/navigation";
import { locales } from "@/shared/lib/locales";
import { Button } from "@/shared/ui/Button";
import { Menu, type MenuItem } from "@/shared/ui/Menu";

/**
 * Language switcher in the header: native names with the code as a hint. Picking a locale opens the same path
 * in that locale. The locale is the root layout's segment, so the whole tree remounts; on the request for the new page
 * the proxy stores the choice in the NEXT_LOCALE cookie when it differs from the browser language.
 */
export const LocaleMenu: FC = () => {
  const t = useTranslations("Pages.Common.LocaleMenu");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const items: MenuItem[] = locales.map((code) => ({
    value: code,
    label: t(`names.${code}`),
    hint: code.toUpperCase(),
  }));

  const currentCode = locale.toUpperCase();

  const switchLocale = (next: string) => {
    if (next === locale || !hasLocale(locales, next)) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <Menu
      label={t("label")}
      trigger={
        // The name has to contain the visible code, for voice control.
        <Button tone="brand" shape="circle-to-pill" aria-label={t("triggerAria", { code: currentCode })}>
          <span className="font-mono text-[13px]">{currentCode}</span>
          <ChevronDownIcon aria-hidden className="hidden size-3.5 lg:block" />
        </Button>
      }
      items={items}
      value={locale}
      onValueChange={switchLocale}
    />
  );
};
