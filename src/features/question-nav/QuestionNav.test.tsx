import { fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuestionNav } from "./QuestionNav";

vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: ({
    replace,
    scroll,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { replace?: boolean; scroll?: boolean }) => (
    <a data-replace={replace} data-scroll={scroll} {...props} onClickCapture={(event) => event.preventDefault()} />
  ),
}));

const items = [
  { slug: "who", linkText: "Who I am" },
  { slug: "how", linkText: "How I work" },
];

beforeEach(() => {
  Element.prototype.scrollTo = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
});

describe("QuestionNav", () => {
  it("is a landmark named by its label", () => {
    render(<QuestionNav label="Questions" items={items} />);

    expect(screen.getByRole("navigation", { name: "Questions" })).toBeInTheDocument();
  });

  it("links every item to its section, replacing the history entry", () => {
    render(<QuestionNav label="Questions" items={items} />);

    const links = within(screen.getByRole("navigation")).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Who I am", "How I work"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#who", "#how"]);
    expect(links.every((link) => link.getAttribute("data-replace") === "true")).toBe(true);
    expect(links.every((link) => link.getAttribute("data-scroll") === "false")).toBe(true);
  });

  describe("on a click", () => {
    const renderWithSections = () => {
      render(
        <>
          <section id="how" data-testid="hidden-copy" />
          <div>
            <QuestionNav label="Questions" items={items} />
            <section id="who" tabIndex={-1} />
            <section id="how" tabIndex={-1} data-testid="section" />
          </div>
        </>,
      );
      const section = screen.getByTestId("section");
      section.scrollIntoView = vi.fn();
      screen.getByTestId("hidden-copy").scrollIntoView = vi.fn();

      return section;
    };

    it("scrolls smoothly to its own section, not to a copy elsewhere", () => {
      const section = renderWithSections();

      fireEvent.click(screen.getByRole("link", { name: "How I work" }));

      expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
      expect(screen.getByTestId("hidden-copy").scrollIntoView).not.toHaveBeenCalled();
    });

    it("jumps with reduced motion", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      const section = renderWithSections();

      fireEvent.click(screen.getByRole("link", { name: "How I work" }));

      expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto" });
    });

    it("moves the focus to the section", () => {
      const section = renderWithSections();

      fireEvent.click(screen.getByRole("link", { name: "How I work" }));

      expect(section).toHaveFocus();
    });

    it("leaves a click with a modifier to the browser", () => {
      const section = renderWithSections();

      fireEvent.click(screen.getByRole("link", { name: "How I work" }), { metaKey: true });

      expect(section.scrollIntoView).not.toHaveBeenCalled();
      expect(section).not.toHaveFocus();
    });
  });

  it("starts on the first item", () => {
    render(<QuestionNav label="Questions" items={items} />);

    expect(screen.getByRole("link", { name: "Who I am" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "How I work" })).not.toHaveAttribute("aria-current");
  });
});
