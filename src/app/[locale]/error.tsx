"use client";

import { useTranslations } from "next-intl";
import type { FC } from "react";

import { ErrorContent } from "@/views/error/ErrorContent";
import type { ErrorTexts } from "@/views/error/error-texts";

interface LocaleErrorProps {
  error: unknown;
}

const LocaleError: FC<LocaleErrorProps> = (props) => {
  const { error } = props;
  const t = useTranslations("Pages.Error");

  const texts: ErrorTexts = {
    metaTitle: t("metaTitle"),
    label: t("label"),
    title: t("title"),
    text: t("text"),
    errorId: t("errorId"),
    reload: t("reload"),
    reloading: t("reloading"),
  };

  return <ErrorContent error={error} texts={texts} />;
};

export default LocaleError;
