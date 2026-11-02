import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { BackLink } from "./BackLink";

vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

describe("BackLink", () => {
  it("leads to the home page by default", () => {
    render(<BackLink label="Back" />);

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/");
  });

  it("keeps a given address", () => {
    render(<BackLink label="Back" href="/blog" />);

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/blog");
  });
});
