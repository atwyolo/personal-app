import { getLocale } from "next-intl/server";
import type { FC } from "react";

import { getProfile } from "@/content/profile";
import { ContactList } from "./ui/ContactList";

interface ContactsProps {
  className?: string;
}

export const Contacts: FC<ContactsProps> = async (props) => {
  const { className } = props;
  const locale = await getLocale();
  const { contacts, cvUrl } = await getProfile(locale);

  return <ContactList contacts={contacts} cvUrl={cvUrl} className={className} />;
};
