import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/en.json";
import { MobileNav } from "./MobileNav";

// next-intl navigation needs the Next router; links render as plain anchors, the current page is "/".
vi.mock("@/shared/lib/i18n/navigation", () => ({
  usePathname: () => "/",
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} href={href} onClick={(event) => (event.preventDefault(), props.onClick?.(event))} />
  ),
}));

const renderNav = () =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MobileNav />
    </NextIntlClientProvider>,
  );

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Open menu" }));
  return screen.findByRole("dialog", { name: "Main navigation" });
};

describe("MobileNav", () => {
  it("opens a panel with every section and the current page marked", async () => {
    const user = userEvent.setup();
    renderNav();

    const dialog = await open(user);

    const links = Array.from(dialog.querySelectorAll("a"));
    expect(links.map((link) => link.textContent)).toEqual(["Home", "About", "Experience", "Skills"]);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("closes with its close button", async () => {
    const user = userEvent.setup();
    renderNav();
    await open(user);

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes when a link is followed", async () => {
    const user = userEvent.setup();
    renderNav();
    await open(user);

    await user.click(screen.getByRole("link", { name: "Skills" }));

    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
