import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { ChipLinks } from "./ChipLinks";

vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a data-router-link {...props} />,
}));

const items = [
  { key: "*", label: "All", count: 11, href: "/blog", current: false },
  { key: "technical", label: "Technical", count: 6, href: "/blog?topic=technical", current: true },
  { key: "software", label: "Software", count: 0, href: "/blog?topic=software", current: false },
];

describe("ChipLinks", () => {
  it("is a group named by its label, a router link per item", () => {
    render(<ChipLinks label="Topic" items={items} />);

    const links = within(screen.getByRole("group", { name: "Topic" })).getAllByRole("link");

    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/blog", "/blog?topic=technical", "/blog?topic=software"]);
    expect(links.every((link) => link.hasAttribute("data-router-link"))).toBe(true);
  });

  it("names each chip by its label and count, a zero included", () => {
    render(<ChipLinks label="Topic" items={items} />);

    expect(screen.getByRole("link", { name: "All 11" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Software 0" })).toBeVisible();
  });

  it("marks only the current chip", () => {
    render(<ChipLinks label="Topic" items={items} />);

    expect(screen.getByRole("link", { name: "Technical 6" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "All 11" })).not.toHaveAttribute("aria-current");
  });

  it("leaves the count out when an item has none", () => {
    render(<ChipLinks label="Tags" items={[{ key: "react", label: "React", href: "/blog", current: false }]} />);

    expect(screen.getByRole("link", { name: "React" })).toBeVisible();
  });
});
