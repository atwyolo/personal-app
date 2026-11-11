import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { FC } from "react";

import { Link } from "@/shared/lib/i18n/navigation";
import { StatusCode } from "@/shared/ui/StatusCode";
import { StatusPage } from "@/shared/ui/StatusPage";
import { statusPill } from "@/shared/ui/status-pill";

export const NotFoundPage: FC = async () => {
  const t = await getTranslations("Pages.NotFound");

  return (
    <StatusPage code={<StatusCode variant="not-found" />} label={t("label")} title={t("title")} text={t("text")}>
      <Link href="/" className={statusPill}>
        <ArrowLeftIcon aria-hidden="true" className="size-[18px]" strokeWidth={2.4} />
        {t("home")}
      </Link>
    </StatusPage>
  );
};
