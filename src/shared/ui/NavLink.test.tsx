import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { NavLink } from "./NavLink";

const pathname = vi.hoisted(() => ({ current: "/" }));

// next-intl navigation needs the Next router; the test only cares about the current path.
vi.mock("@/shared/lib/i18n/navigation", () => ({
  usePathname: () => pathname.current,
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

const renderAt = (current: string, href: string) => {
  pathname.current = current;
  render(<NavLink href={href}>Link</NavLink>);
  return screen.getByRole("link", { name: "Link" });
};

describe("NavLink", () => {
  it("marks the link of the current page", () => {
    expect(renderAt("/blog", "/blog")).toHaveAttribute("aria-current", "page");
  });

  it("stays active on pages nested under its section", () => {
    expect(renderAt("/blog/hello", "/blog")).toHaveAttribute("aria-current", "page");
  });

  it("repeats the label for the width the desktop navigation reserves", () => {
    expect(renderAt("/", "/")).toHaveAttribute("data-label", "Link");
  });

  it("does not mark other sections", () => {
    expect(renderAt("/about", "/blog")).not.toHaveAttribute("aria-current");
  });

  it("treats home as active only on the home page itself", () => {
    expect(renderAt("/blog", "/")).not.toHaveAttribute("aria-current");
  });
});
