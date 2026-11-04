import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import messages from "../../../../messages/en.json";
import { ExperienceBar } from "./ExperienceBar";
import { ExperienceColumn } from "./ExperienceColumn";

vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

describe("with no jobs", () => {
  const renderColumn = () =>
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ExperienceColumn title="Projects" jobs={[]} />
      </NextIntlClientProvider>,
    );

  it("keeps the Back link and the heading", () => {
    renderColumn();

    expect(screen.getByRole("link", { name: "Back" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Projects" })).toBeVisible();
  });

  it("drops the empty navigation landmark", () => {
    renderColumn();

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("drops the empty stage", () => {
    const { container } = renderColumn();

    expect(container.querySelector("[data-experience-stage]")).not.toBeInTheDocument();
  });

  it("drops the empty sticky bar", () => {
    const { container } = render(<ExperienceBar jobs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
