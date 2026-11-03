import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type BlogListState, DEFAULT_BLOG_LIST_STATE } from "@/schemas/blog-list";
import { NavigationScope } from "@/shared/ui/NavigationScope";
import messages from "../../../messages/en.json";
import { TagSearch } from "./TagSearch";

const intlPush = vi.fn(() => new Promise<void>(() => {}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/shared/lib/i18n/navigation", () => ({ useRouter: () => ({ push: intlPush }) }));

const state: BlogListState = { ...DEFAULT_BLOG_LIST_STATE, topic: "technical", tags: ["React"], page: 2 };
const suggestions = [
  { tag: "React", count: 5 },
  { tag: "Jest", count: 1 },
  { tag: "Next.js", count: 3 },
];

const renderSearch = (onFocusChange?: (focused: boolean) => void) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <NavigationScope>
        <TagSearch state={state} suggestions={suggestions} onFocusChange={onFocusChange} />
      </NavigationScope>
    </NextIntlClientProvider>,
  );

const field = () => screen.getByRole("combobox", { name: "Search by tag" });

beforeEach(() => {
  intlPush.mockClear();
});

describe("TagSearch", () => {
  it("shows no suggestions before typing", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(field());

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(field()).toHaveAttribute("aria-expanded", "false");
  });

  it("suggests the tags that contain the text, whatever its case, without the selected ones, with their counts", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(field(), "E");

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(["Jest1 post", "Next.js3 posts"]);
  });

  it("says so when no tag matches", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(field(), "zz");

    // Base UI appends an invisible word joiner (U+2060) to the empty text, so the match is not exact.
    expect(screen.getByText(/No matching tags/)).toBeVisible();
  });

  it("picks the highlighted tag with the keyboard: the new state on page 1, the field cleared and closed", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(field(), "e");
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(intlPush).toHaveBeenCalledWith("/blog?topic=technical&tags=React,Next.js", { scroll: false });
    expect(field()).toHaveValue("");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("picks a tag with the pointer", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(field(), "jest");
    await user.click(screen.getByRole("option", { name: /Jest/ }));

    expect(intlPush).toHaveBeenCalledWith("/blog?topic=technical&tags=React,Jest", { scroll: false });
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(field(), "e");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("clears the typed text with its × button, which shows only while there is text", async () => {
    const user = userEvent.setup();
    renderSearch();

    expect(screen.queryByRole("button", { name: "Clear text" })).toBeNull();
    await user.type(field(), "je");
    // While the suggestions are open Base UI hides the rest of the page from assistive technology (`aria-hidden`);
    // the button is still there for the pointer. A hidden element has no accessible name, so it is found by its label.
    await user.click(screen.getByLabelText("Clear text"));

    expect(field()).toHaveValue("");
    expect(screen.queryByLabelText("Clear text")).toBeNull();
  });

  it("closes and clears the text on Escape: the keyboard's way to clear, where the pointer has the ×", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(field(), "je");
    await user.keyboard("{Escape}");

    expect(field()).toHaveValue("");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("reports focus and blur", async () => {
    const user = userEvent.setup();
    const onFocusChange = vi.fn();
    renderSearch(onFocusChange);

    await user.click(field());
    expect(onFocusChange).toHaveBeenLastCalledWith(true);
    await act(async () => field().blur());
    expect(onFocusChange).toHaveBeenLastCalledWith(false);
  });
});
