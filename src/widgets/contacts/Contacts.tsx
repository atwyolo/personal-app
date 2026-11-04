import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/content/profile";
import { ContactList } from "./ui/ContactList";

interface ContactsProps {
  /** Grid placement from the page. */
  className?: string;
}

/**
 * Contact buttons of the first screen. Reads the profile itself, like the hero.
 * The CV button goes to the blob download URL, because `<a download>` is ignored cross-origin.
 */
export const Contacts: FC<ContactsProps> = async (props) => {
  const { className } = props;
  const locale = await getLocale();
  const { contacts, cvUrl } = await getProfile(locale);

  return <ContactList contacts={contacts} cvUrl={cvUrl} className={className} />;
};
