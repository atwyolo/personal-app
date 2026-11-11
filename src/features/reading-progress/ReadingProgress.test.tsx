import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReadingProgress } from "./ReadingProgress";

const rects: Record<string, { top: number; height: number }> = {
  glovo: { top: 0, height: 800 },
  sony: { top: 800, height: 800 },
};

const renderPage = () => {
  render(
    <>
      <article id="sony" data-testid="hidden-copy" />
      <ReadingProgress>
        <a href="#glovo" data-job="0" data-active="" aria-current="true">
          Glovo
        </a>
        <a href="#sony" data-job="1">
          Sony
        </a>
        <div data-job="1" data-testid="stage-block" />
        <article id="glovo" tabIndex={-1} />
        <article id="sony" tabIndex={-1} data-testid="article" />
      </ReadingProgress>
    </>,
  );

  const article = screen.getByTestId("article");
  article.scrollIntoView = vi.fn();
  screen.getByTestId("hidden-copy").scrollIntoView = vi.fn();

  return article;
};

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 5000 });
  Element.prototype.getBoundingClientRect = vi.fn(function (this: Element) {
    return (rects[this.id] ?? { top: 0, height: 0 }) as DOMRect;
  });
});

describe("ReadingProgress", () => {
  it("renders its children", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Sony" })).toBeVisible();
  });

  it("writes the progress on everything that follows a job", () => {
    renderPage();

    expect(Number(screen.getByRole("link", { name: "Glovo" }).style.getPropertyValue("--progress"))).toBeCloseTo(0.384);
    expect(screen.getByTestId("stage-block").style.getPropertyValue("--progress")).toBe("0");
  });

  it("keeps the first job active at the top of the page", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "Glovo" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Glovo" })).toHaveAttribute("data-active");
  });

  describe("on a click", () => {
    it("scrolls smoothly to its own article, not to a copy elsewhere", () => {
      const article = renderPage();

      fireEvent.click(screen.getByRole("link", { name: "Sony" }));

      expect(article.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
      expect(screen.getByTestId("hidden-copy").scrollIntoView).not.toHaveBeenCalled();
    });

    it("jumps with reduced motion", () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      const article = renderPage();

      fireEvent.click(screen.getByRole("link", { name: "Sony" }));

      expect(article.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto" });
    });

    it("moves the focus to the article", () => {
      const article = renderPage();

      fireEvent.click(screen.getByRole("link", { name: "Sony" }));

      expect(article).toHaveFocus();
    });

    it("marks the clicked job at once", () => {
      renderPage();

      fireEvent.click(screen.getByRole("link", { name: "Sony" }));

      expect(screen.getByRole("link", { name: "Sony" })).toHaveAttribute("aria-current", "true");
      expect(screen.getByTestId("stage-block")).toHaveAttribute("data-active");
      expect(screen.getByRole("link", { name: "Glovo" })).not.toHaveAttribute("aria-current");
      expect(screen.getByRole("link", { name: "Glovo" })).not.toHaveAttribute("data-active");
    });

    it("leaves a click with a modifier to the browser", () => {
      const article = renderPage();

      fireEvent.click(screen.getByRole("link", { name: "Sony" }), { metaKey: true });

      expect(article.scrollIntoView).not.toHaveBeenCalled();
      expect(screen.getByRole("link", { name: "Sony" })).not.toHaveAttribute("aria-current");
    });
  });
});
