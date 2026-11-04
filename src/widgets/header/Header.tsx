import { getLocale, getTranslations } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/db/queries/home";
import { LocaleMenu } from "@/features/locale-menu/LocaleMenu";
import { MobileNav } from "@/features/mobile-nav/MobileNav";
import { ThemeMenu } from "@/features/theme-menu/ThemeMenu";
import { Link } from "@/shared/lib/i18n/navigation";
import { siteNav } from "@/shared/lib/site-nav";
import { NavLink } from "@/shared/ui/NavLink";

/**
 * Sticky site header (Server Component): name linking home, desktop navigation from lg, locale and theme menus.
 * Below lg (mobile and the undesigned tablet range) the navigation moves to the mobile menu.
 */
export const Header: FC = async () => {
  const locale = await getLocale();
  const [profile, t] = await Promise.all([getProfile(locale), getTranslations("Pages.Common.Header")]);

  return (
    <header className="reveal reveal-left sticky top-0 z-10 border-b border-card-border bg-card">
      <div className="mx-auto flex h-16 max-w-[720px] items-center gap-2 pr-3 pl-4 lg:h-[72px] lg:max-w-none lg:gap-8 lg:pr-15 lg:pl-5">
        <Link
          href="/"
          className="min-w-0 grow truncate text-[17px] font-semibold tracking-[-0.02em] whitespace-nowrap lg:text-xl"
        >
          {profile.name}
        </Link>
        <nav aria-label={t("navLabel")} className="site-nav relative hidden gap-7 text-[15px] lg:flex">
          {siteNav.map((item) => (
            <NavLink key={item.key} href={item.href}>
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
          {/* Slides under the current item, CSS only: see `.nav-indicator` in globals.css. */}
          <span aria-hidden className="nav-indicator" />
        </nav>
        {/* Client leaves; the header itself stays a Server Component. */}
        <div className="flex gap-2">
          <LocaleMenu />
          <ThemeMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  );
};
