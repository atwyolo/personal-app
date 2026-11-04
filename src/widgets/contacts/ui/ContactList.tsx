import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FC, Fragment } from "react";

import { cn } from "@/shared/lib/utils";
import { EnvelopeIcon, LinkedInIcon, WhatsAppIcon } from "./ContactIcons";
import { ContactLink } from "./ContactLink";

const CHANNEL_ICON = "size-[26px] text-brand";

interface Contact {
  href: string;
  display: string;
}

interface ContactListProps {
  contacts: {
    whatsapp?: Contact | null;
    email?: (Contact & { mailbox: string }) | null;
    linkedin?: Contact | null;
  };
  cvUrl?: string | null;
  className?: string;
}

/**
 * The contact buttons. Every one is optional on purpose: the UI does not rely on the content schema's required fields,
 * so a contact without a value simply has no button. `display` decides, because a derived `href` is never empty.
 */
export const ContactList: FC<ContactListProps> = (props) => {
  const { contacts, cvUrl, className } = props;
  const { whatsapp, email, linkedin } = contacts;
  const t = useTranslations("Pages.Common.Contacts");

  if (!whatsapp?.display && !email?.display && !linkedin?.display && !cvUrl) return null;

  return (
    <ul aria-label={t("label")} className={cn("flex min-w-0 flex-col gap-3", className)}>
      {whatsapp?.display && (
        <li>
          <ContactLink
            href={whatsapp.href}
            label={t("whatsappAria", { phone: whatsapp.display })}
            title={whatsapp.display}
            tone="channel"
            external
            className="reveal"
            mark={<WhatsAppIcon className={CHANNEL_ICON} />}
          >
            {t("whatsapp")}
          </ContactLink>
        </li>
      )}
      {email?.display && (
        <li>
          <ContactLink
            href={email.href}
            label={t("mailAria", { email: email.display })}
            title={email.display}
            tone="channel"
            mark={<EnvelopeIcon className={CHANNEL_ICON} />}
            className="reveal reveal-left"
          >
            {/* The design's 15px keeps the address on one line from a 288px column; narrower ones wrap it at the dots, nowhere else. */}
            <span className="block text-base leading-tight lg:text-[15px]">
              {email.mailbox.split(".").map((part, index, parts) => (
                <Fragment key={index}>
                  {part}
                  {index < parts.length - 1 && (
                    <>
                      .<wbr />
                    </>
                  )}
                </Fragment>
              ))}
            </span>
          </ContactLink>
        </li>
      )}
      {linkedin?.display && (
        <li>
          <ContactLink
            href={linkedin.href}
            label={t("linkedinAria")}
            title={linkedin.display}
            tone="channel"
            external
            className="reveal"
            mark={<LinkedInIcon className={CHANNEL_ICON} />}
          >
            {t("linkedin")}
          </ContactLink>
        </li>
      )}
      {cvUrl && (
        <li>
          <ContactLink
            href={cvUrl}
            label={t("downloadCvAria")}
            tone="cv"
            className="reveal reveal-left"
            mark={<DownloadIcon aria-hidden className="size-6" />}
            trailing={<span className="font-mono text-xs font-medium tracking-[0.06em] opacity-85">{t("pdf")}</span>}
          >
            {t("downloadCv")}
          </ContactLink>
        </li>
      )}
    </ul>
  );
};
