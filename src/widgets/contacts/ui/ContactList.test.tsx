import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../../messages/en.json";
import { ContactList } from "./ContactList";

const contacts = {
  whatsapp: { href: "https://wa.me/1", display: "+1" },
  email: { href: "mailto:a.b@c.d", display: "a.b@c.d", mailbox: "a.b" },
  linkedin: { href: "https://linkedin.com/in/a", display: "linkedin.com/in/a" },
};
const cvUrl = "https://example.com/cv.pdf?download=1";

const renderList = (props: Partial<Parameters<typeof ContactList>[0]> = {}) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ContactList contacts={contacts} cvUrl={cvUrl} {...props} />
    </NextIntlClientProvider>,
  );

const buttons = () =>
  screen
    .queryAllByRole("link")
    .map((link) => link.getAttribute("aria-label") ?? link.textContent?.replace(/\s+/g, " ").trim());

describe("ContactList", () => {
  it("renders a button per contact, the CV last", () => {
    renderList();

    expect(buttons()).toEqual(["WhatsApp: +1", "Mail: a.b@c.d", "LinkedIn profile", "Download CV PDF"]);
  });

  it("skips the WhatsApp button without a phone", () => {
    renderList({ contacts: { ...contacts, whatsapp: null } });

    expect(buttons()).toEqual(["Mail: a.b@c.d", "LinkedIn profile", "Download CV PDF"]);
  });

  it("skips the mail button without an email", () => {
    renderList({ contacts: { ...contacts, email: null } });

    expect(buttons()).toEqual(["WhatsApp: +1", "LinkedIn profile", "Download CV PDF"]);
  });

  it("skips the LinkedIn button without a profile URL", () => {
    renderList({ contacts: { ...contacts, linkedin: null } });

    expect(buttons()).toEqual(["WhatsApp: +1", "Mail: a.b@c.d", "Download CV PDF"]);
  });

  it("names the CV button by its visible text, without an aria-label", () => {
    renderList();

    const cv = screen.getByRole("link", { name: "Download CV PDF" });
    expect(cv).not.toHaveAttribute("aria-label");
  });

  it("skips the CV button without a file", () => {
    renderList({ cvUrl: null });

    expect(buttons()).toEqual(["WhatsApp: +1", "Mail: a.b@c.d", "LinkedIn profile"]);
  });

  it("skips a contact whose value is empty", () => {
    renderList({ contacts: { ...contacts, email: { href: "mailto:", display: "", mailbox: "" } } });

    expect(buttons()).toEqual(["WhatsApp: +1", "LinkedIn profile", "Download CV PDF"]);
  });

  it("renders no empty list when there is nothing to show", () => {
    renderList({ contacts: { whatsapp: null, email: null, linkedin: null }, cvUrl: null });

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
