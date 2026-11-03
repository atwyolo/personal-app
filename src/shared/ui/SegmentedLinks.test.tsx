import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { SegmentedLinks } from "./SegmentedLinks";

vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a data-router-link {...props} />,
}));

const items = [
  { key: "newest", label: "Newest", href: "/blog", current: true },
  { key: "oldest", label: "Oldest", href: "/blog?sort=oldest", current: false },
];

describe("SegmentedLinks", () => {
  it("is a group named by its label, a router link per segment", () => {
    render(<SegmentedLinks label="Sort by date" items={items} />);

    const links = within(screen.getByRole("group", { name: "Sort by date" })).getAllByRole("link");

    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Newest", "/blog"],
      ["Oldest", "/blog?sort=oldest"],
    ]);
    expect(links.every((link) => link.hasAttribute("data-router-link"))).toBe(true);
  });

  it("marks only the current segment", () => {
    render(<SegmentedLinks label="Sort by date" items={items} />);

    expect(screen.getByRole("link", { name: "Newest" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Oldest" })).not.toHaveAttribute("aria-current");
  });
});
