"use client";

import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FC, type MouseEvent, useState } from "react";

import { siteNav } from "@/shared/lib/site-nav";
import { Button } from "@/shared/ui/Button";
import { Drawer } from "@/shared/ui/Drawer";
import { NavLink } from "@/shared/ui/NavLink";

/**
 * Mobile and tablet navigation (below lg): a hamburger opening a right-side panel with the same sections as the
 * desktop header. Not designed in the handoff; follows its proposed default. Closes when a link is followed.
 */
export const MobileNav: FC = () => {
  const t = useTranslations("Pages.Common.Header");
  const [open, setOpen] = useState(false);

  // One delegated handler instead of an onClick on every link.
  const closeOnLink = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as Element).closest("a")) setOpen(false);
  };

  return (
    <Drawer
      trigger={
        <Button shape="circle" aria-label={t("openMenu")} className="lg:hidden">
          <MenuIcon aria-hidden />
        </Button>
      }
      title={t("navLabel")}
      closeLabel={t("closeMenu")}
      open={open}
      onOpenChange={setOpen}
    >
      <nav aria-label={t("navLabel")} onClick={closeOnLink}>
        <ul className="flex flex-col">
          {siteNav.map((item) => (
            <li key={item.key}>
              <NavLink href={item.href} className="flex min-h-12 items-center text-[17px]">
                {t(`nav.${item.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </Drawer>
  );
};
