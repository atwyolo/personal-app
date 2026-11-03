import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChipGroup } from "./ChipGroup";

const items = [
  { value: "all", label: "All", count: 41 },
  { value: "core", label: "Core", count: 5 },
  { value: "tools", label: "Tools", count: 13 },
];

const renderGroup = (onValueChange = vi.fn()) => {
  render(
    <>
      <ChipGroup label="Domain" items={items} value="all" onValueChange={onValueChange} />
      <button type="button">After</button>
    </>,
  );

  return onValueChange;
};

describe("ChipGroup", () => {
  it("is a group named by its label", () => {
    renderGroup();

    expect(screen.getByRole("group", { name: "Domain" })).toBeVisible();
  });

  it("presses only the chip of the current value", () => {
    renderGroup();

    expect(screen.getByRole("button", { name: "All 41" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Core 5" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Tools 13" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reports the value of another chip", async () => {
    const onValueChange = renderGroup();

    await userEvent.click(screen.getByRole("button", { name: "Tools 13" }));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("tools");
  });

  it("never leaves the group with no chip pressed", async () => {
    const onValueChange = renderGroup();

    await userEvent.click(screen.getByRole("button", { name: "All 41" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "All 41" })).toHaveAttribute("aria-pressed", "true");
  });

  it("moves between the chips with the arrows and leaves the group with one Tab", async () => {
    renderGroup();

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "All 41" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Core 5" })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });
});
