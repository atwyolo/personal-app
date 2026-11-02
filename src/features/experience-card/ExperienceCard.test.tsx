import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Experience } from "@/db/queries/home";
import messages from "../../../messages/en.json";
import { ExperienceCard } from "./ExperienceCard";

// next-intl navigation needs the Next router.
vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

const job: Experience = {
  slug: "glovo",
  company: "Glovo",
  role: null,
  startDate: "2024-11-01",
  endDate: "2026-10-01",
  today: "2026-10-30",
  imageUrl: null,
  descriptionShort: "Built a chat. Cut defects.",
  descriptionFull: null,
  skills: ["Next.js", "Jest"],
};

const renderCard = (overrides: Partial<Experience> = {}) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ExperienceCard job={{ ...job, ...overrides }} />
    </NextIntlClientProvider>,
  );

describe("ExperienceCard", () => {
  it("shows the job's image, described by the company name", () => {
    renderCard({ imageUrl: "https://example.com/glovo.jpg" });

    expect(screen.getByRole("img", { name: "Glovo" }).tagName).toBe("IMG");
  });

  it("shows a placeholder described by the company name when the job has no image", () => {
    renderCard();

    expect(screen.getByRole("img", { name: "Glovo" }).tagName).toBe("DIV");
  });

  it("names the company in a third-level heading", () => {
    renderCard();

    expect(screen.getByRole("heading", { level: 3, name: "Glovo" })).toBeVisible();
  });

  it("shows the period with its duration", () => {
    renderCard();

    expect(screen.getByRole("article")).toHaveTextContent("11/2024 – 10/2026 · 2 years");
  });

  it("counts a current job up to today and calls its end present", () => {
    renderCard({ startDate: "2025-11-01", endDate: null });

    expect(screen.getByRole("article")).toHaveTextContent("11/2025 – present · 1 year");
  });

  it("shows the description", () => {
    renderCard();

    expect(screen.getByText("Built a chat. Cut defects.")).toBeVisible();
  });

  it("lists the skills as chips", () => {
    renderCard();

    expect(within(screen.getByRole("list")).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Next.js",
      "Jest",
    ]);
  });

  it("drops the list when the job has no skills", () => {
    renderCard({ skills: [] });

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("links to the job on the projects page", () => {
    renderCard({ slug: "sony" });

    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute("href", "/projects#sony");
  });
});
