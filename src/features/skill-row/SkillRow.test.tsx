import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/en.json";
import { SkillRow } from "./SkillRow";

const renderRow = (level: number, layout?: "home" | "list") =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SkillRow skill={{ name: "React", level }} layout={layout} />
    </NextIntlClientProvider>,
  );

describe("SkillRow", () => {
  it("shows the name and the level", () => {
    renderRow(9);

    expect(screen.getByText("React")).toBeVisible();
    expect(screen.getByText("9/10")).toBeVisible();
  });

  it("reports the level to a screen reader as a meter", () => {
    renderRow(9);

    const meter = screen.getByRole("meter", { name: "React: level 9 of 10" });

    expect(meter).toHaveAttribute("aria-valuenow", "9");
    expect(meter).toHaveAttribute("aria-valuemin", "1");
    expect(meter).toHaveAttribute("aria-valuemax", "10");
    expect(meter).toHaveAttribute("aria-valuetext", "9/10");
  });

  it.each([1, 7, 10])("fills %i of ten segments", (level) => {
    renderRow(level);

    const meter = screen.getByRole("meter");

    expect(meter.querySelectorAll(".bg-brand")).toHaveLength(level);
    expect(meter.querySelectorAll(".bg-placeholder")).toHaveLength(10 - level);
  });

  it("keeps Home's grid by default", () => {
    renderRow(9);

    expect(screen.getByRole("meter")).toHaveClass("lg:grid-cols-[150px_minmax(0,1fr)_44px]");
  });

  it("puts the name and the level on one line in the list layout", () => {
    renderRow(9, "list");

    const meter = screen.getByRole("meter");
    expect(meter).toHaveClass("grid-cols-[minmax(0,1fr)_auto]", "lg:grid-cols-[132px_minmax(0,1fr)_40px]");
    expect(screen.getByText("9/10")).toHaveClass("row-start-1");
  });
});
