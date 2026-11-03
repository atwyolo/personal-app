import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "./Pagination";

// next-intl navigation needs the Next router; the marker tells the router link from a plain anchor.
vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a data-router-link {...props} />,
}));

const renderPagination = (page: number, pageCount: number) =>
  render(
    <Pagination
      label="Pagination"
      page={page}
      pageCount={pageCount}
      hrefFor={(n) => `/blog?page=${n}`}
      previousLabel="Previous page"
      nextLabel="Next page"
      pageLabel={(n) => `Go to page ${n}`}
    />,
  );

describe("Pagination", () => {
  it("is a navigation landmark named by its label", () => {
    renderPagination(2, 3);

    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeVisible();
  });

  it("links every page through the router, named by its label", () => {
    renderPagination(2, 3);

    for (const n of [1, 2, 3]) {
      const link = screen.getByRole("link", { name: `Go to page ${n}` });
      expect(link).toHaveAttribute("href", `/blog?page=${n}`);
      expect(link).toHaveAttribute("data-router-link");
      expect(link).toHaveTextContent(String(n));
    }
  });

  it("marks only the current page", () => {
    renderPagination(2, 3);

    expect(screen.getByRole("link", { name: "Go to page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Go to page 1" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Go to page 3" })).not.toHaveAttribute("aria-current");
  });

  it("links previous and next to the neighbouring pages", () => {
    renderPagination(2, 3);

    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "/blog?page=1");
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/blog?page=3");
  });

  it("makes previous a disabled button on the first page and next on the last one", () => {
    const { unmount } = renderPagination(1, 3);

    expect(screen.queryByRole("link", { name: "Previous page" })).toBeNull();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Next page" })).toBeVisible();
    unmount();

    renderPagination(3, 3);
    expect(screen.queryByRole("link", { name: "Next page" })).toBeNull();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("names a scroll target on every link when given one", () => {
    render(
      <Pagination
        label="Pagination"
        page={2}
        pageCount={3}
        hrefFor={(n) => `/blog?page=${n}`}
        previousLabel="Previous page"
        nextLabel="Next page"
        pageLabel={(n) => `Go to page ${n}`}
        scrollTarget="list-head"
      />,
    );

    for (const link of screen.getAllByRole("link")) expect(link).toHaveAttribute("data-scope-scroll", "list-head");
  });

  it("renders nothing for a single page", () => {
    const { container } = renderPagination(1, 1);

    expect(container).toBeEmptyDOMElement();
  });

  it("hides the ellipses from assistive technology and keeps seven items", () => {
    renderPagination(6, 12);

    const list = within(screen.getByRole("navigation")).getByRole("list");
    // Previous, seven items, next.
    expect(within(list).getAllByRole("listitem", { hidden: true })).toHaveLength(9);
    expect(within(list).getAllByRole("link").map((link) => link.textContent)).toEqual(
      expect.arrayContaining(["1", "5", "6", "7", "12"]),
    );
    const ellipses = within(list).getAllByText("More pages");
    expect(ellipses).toHaveLength(2);
    for (const ellipsis of ellipses) expect(ellipsis.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
