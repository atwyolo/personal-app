"use client";

import { ChevronDownIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { FC } from "react";

import { useMounted } from "@/shared/lib/useMounted";
import { Button } from "@/shared/ui/Button";
import { Menu, type MenuItem } from "@/shared/ui/Menu";

export const ThemeMenu: FC = () => {
  const t = useTranslations("Pages.Common.ThemeMenu");
  const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const items: MenuItem[] = [
    { value: "dark", label: t("dark") },
    { value: "light", label: t("light") },
    {
      value: "system",
      label: t("system"),
      hint: mounted && systemTheme ? t("systemNow", { theme: systemTheme }) : undefined,
    },
  ];

  const icon = !mounted ? (
    <span className="size-[18px]" aria-hidden />
  ) : resolvedTheme === "dark" ? (
    <MoonIcon aria-hidden />
  ) : (
    <SunIcon aria-hidden />
  );

  return (
    <Menu
      label={t("label")}
      trigger={
        <Button tone="brand" shape="circle-to-pill" aria-label={t("label")}>
          {icon}
          <ChevronDownIcon aria-hidden className="hidden size-3.5 lg:block" />
        </Button>
      }
      items={items}
      value={mounted ? (theme ?? "system") : "system"}
      onValueChange={setTheme}
    />
  );
};
