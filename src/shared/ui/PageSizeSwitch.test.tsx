import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { PageSizeSwitch } from "./PageSizeSwitch";

vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a data-router-link {...props} />,
}));

describe("PageSizeSwitch", () => {
  it("is a group named by its label with a link per size", () => {
    render(<PageSizeSwitch label="Posts per page" sizes={[10, 20, 50]} current={20} hrefFor={(n) => `/blog?per=${n}`} />);

    const group = screen.getByRole("group", { name: "Posts per page" });
    const links = within(group).getAllByRole("link");

    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["10", "/blog?per=10"],
      ["20", "/blog?per=20"],
      ["50", "/blog?per=50"],
    ]);
    expect(links.every((link) => link.hasAttribute("data-router-link"))).toBe(true);
  });

  it("names a scroll target on every link when given one", () => {
    render(
      <PageSizeSwitch
        label="Posts per page"
        sizes={[10, 20]}
        current={10}
        hrefFor={(n) => `/blog?per=${n}`}
        scrollTarget="list-head"
      />,
    );

    for (const link of screen.getAllByRole("link")) expect(link).toHaveAttribute("data-scope-scroll", "list-head");
  });

  it("marks only the current size", () => {
    render(<PageSizeSwitch label="Posts per page" sizes={[10, 20, 50]} current={20} hrefFor={(n) => `/blog?per=${n}`} />);

    expect(screen.getByRole("link", { name: "20" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "10" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "50" })).not.toHaveAttribute("aria-current");
  });
});
