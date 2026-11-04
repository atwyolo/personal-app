import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import messages from "../../../../messages/en.json";
import { SkillsExplorer } from "./SkillsExplorer";

const skills = [
  { name: "React", level: 9, domain: "frameworks" },
  { name: "Next.js", level: 9, domain: "frameworks" },
  { name: "Docker", level: 6, domain: "tools" },
  { name: "Docker Compose", level: 6, domain: "tools" },
  { name: "CSS3", level: 6, domain: "core" },
];
const domains = [
  { key: "core", label: "Core", count: 1 },
  { key: "frameworks", label: "Frameworks", count: 2 },
  { key: "tools", label: "Tools", count: 2 },
];

const renderExplorer = () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SkillsExplorer skills={skills} domains={domains} />
    </NextIntlClientProvider>,
  );

  return user;
};

const shownNames = () => screen.queryAllByRole("meter").map((row) => row.getAttribute("aria-label")?.split(":")[0]);
const count = () => screen.getByRole("status");
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("SkillsExplorer", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("lists every skill in the given order and counts them politely", () => {
    renderExplorer();

    expect(shownNames()).toEqual(["React", "Next.js", "Docker", "Docker Compose", "CSS3"]);
    expect(count()).toHaveTextContent("5 skills");
    expect(count()).toHaveAttribute("aria-live", "polite");
  });

  it("filters by the query only once typing has paused for 300 ms", async () => {
    const user = renderExplorer();

    await user.type(screen.getByRole("searchbox", { name: "Search skills" }), "dock");
    expect(shownNames()).toHaveLength(5);

    await wait(300);
    expect(shownNames()).toEqual(["Docker", "Docker Compose"]);
    expect(count()).toHaveTextContent("2 of 5");
  });

  it("shows everything at once when the field is cleared, and the old query never lands", async () => {
    const user = renderExplorer();
    const field = screen.getByRole("searchbox");

    await user.type(field, "dock");
    await wait(100);
    await user.clear(field);
    expect(shownNames()).toHaveLength(5);

    await wait(1000);
    expect(shownNames()).toHaveLength(5);
    expect(count()).toHaveTextContent("5 skills");
  });

  it("filters by a domain at once, and All brings everything back", async () => {
    const user = renderExplorer();

    await user.click(screen.getByRole("button", { name: "Tools 2" }));
    expect(shownNames()).toEqual(["Docker", "Docker Compose"]);
    expect(count()).toHaveTextContent("2 of 5");

    await user.click(screen.getByRole("button", { name: "All 5" }));
    expect(shownNames()).toHaveLength(5);
    expect(count()).toHaveTextContent("5 skills");
  });

  it("names the query when nothing matches in a domain, and All shows its matches elsewhere", async () => {
    const user = renderExplorer();

    await user.click(screen.getByRole("button", { name: "Core 1" }));
    await user.type(screen.getByRole("searchbox"), "dock");
    await wait(300);

    expect(shownNames()).toEqual([]);
    expect(screen.getByText("No skills match “dock”.")).toBeVisible();
    expect(count()).toHaveTextContent("0 of 5");

    await user.click(screen.getByRole("button", { name: "All 2" }));
    expect(shownNames()).toEqual(["Docker", "Docker Compose"]);
    expect(screen.queryByText(/No skills match/)).not.toBeInTheDocument();
  });

  it("never reorders the skills", async () => {
    const user = renderExplorer();

    await user.type(screen.getByRole("searchbox"), "e");
    await wait(300);

    expect(shownNames()).toEqual(["React", "Next.js", "Docker", "Docker Compose"]);
  });

  it("offers All with the total first, then every domain with its count", () => {
    renderExplorer();

    const group = screen.getByRole("group", { name: "Domain" });
    expect(within(group).getAllByRole("button").map((chip) => chip.textContent)).toEqual([
      "All 5",
      "Core 1",
      "Frameworks 2",
      "Tools 2",
    ]);
  });

  it("treats a query of spaces as no query", async () => {
    const user = renderExplorer();

    await user.type(screen.getByRole("searchbox"), "   ");
    await wait(300);

    expect(shownNames()).toHaveLength(5);
    expect(count()).toHaveTextContent("5 skills");
  });

  it("counts the matches of the query on every chip, after the same pause", async () => {
    const user = renderExplorer();
    const chipTexts = () => within(screen.getByRole("group", { name: "Domain" })).getAllByRole("button").map((c) => c.textContent);

    await user.type(screen.getByRole("searchbox"), "dock");
    expect(chipTexts()).toEqual(["All 5", "Core 1", "Frameworks 2", "Tools 2"]);

    await wait(300);
    expect(chipTexts()).toEqual(["All 2", "Core 0", "Frameworks 0", "Tools 2"]);
  });
});

