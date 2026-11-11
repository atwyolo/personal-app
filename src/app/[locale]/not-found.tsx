import { getTranslations } from "next-intl/server";
import type { FC } from "react";

const NotFound: FC = async () => {
  const t = await getTranslations("Pages.NotFound");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-4xl font-bold">404</h1>
      <p>{t("message")}</p>
    </main>
  );
};

export default NotFound;
