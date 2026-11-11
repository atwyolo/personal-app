import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { PageHero } from "./PageHero";

vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

const renderHero = () => render(<PageHero backLabel="Back" title="Skills" intro="Everything I work with." />);

describe("PageHero", () => {
  it("names the page with its only heading", () => {
    renderHero();

    expect(screen.getByRole("heading", { level: 1, name: "Skills" })).toBeVisible();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("shows the intro", () => {
    renderHero();

    expect(screen.getByText("Everything I work with.")).toBeVisible();
  });

  it("starts with the link back home", () => {
    renderHero();

    const link = screen.getByRole("link", { name: "Back" });
    expect(link).toHaveAttribute("href", "/");
    expect(link.compareDocumentPosition(screen.getByRole("heading"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
