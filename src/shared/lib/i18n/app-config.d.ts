import type messages from "../../../../messages/en.json";
import type { Locale } from "@/shared/lib/locales";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Pick<typeof messages, "Pages">;
  }
}
