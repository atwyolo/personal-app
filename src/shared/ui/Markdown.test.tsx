import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import messages from "../../../messages/en.json";
import { Markdown } from "./Markdown";

vi.mock("@/shared/lib/i18n/navigation", () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => {
    const { prefetch, ...rest } = props;
    return <a data-router-link data-prefetch={prefetch === undefined ? undefined : String(prefetch)} {...rest} />;
  },
}));

const renderMarkdown = (source: string, headingOffset?: number) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Markdown source={source} headingOffset={headingOffset} className="custom" />
    </NextIntlClientProvider>,
  );

describe("Markdown", () => {
  it("renders paragraphs as direct children of one block, which pages style by position", () => {
    const { container } = renderMarkdown("First.\n\nSecond.");

    const root = container.firstElementChild!;
    expect(root).toHaveClass("custom");
    expect([...root.children].map((node) => [node.tagName, node.textContent])).toEqual([
      ["P", "First."],
      ["P", "Second."],
    ]);
  });

  it("renders bold text as strong in the semibold weight", () => {
    renderMarkdown("**Results:**");

    expect(screen.getByText("Results:").tagName).toBe("STRONG");
    expect(screen.getByText("Results:")).toHaveClass("font-semibold");
  });

  it("renders italic text as em", () => {
    renderMarkdown("*soft*");

    expect(screen.getByText("soft").tagName).toBe("EM");
  });

  it("renders a bullet list with the site's square markers", () => {
    renderMarkdown("- One\n- Two");

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["One", "Two"]);
    expect(list.className).toContain("*:before:bg-deco");
  });

  it("renders a numbered list as ol", () => {
    renderMarkdown("1. One\n2. Two");

    expect(screen.getByRole("list").tagName).toBe("OL");
  });

  it("shifts a heading below its context and sizes it by the level written in the file", () => {
    renderMarkdown("# Big\n\n## Medium\n\n###### Small", 2);

    expect(screen.getByRole("heading", { name: "Big" }).tagName).toBe("H3");
    expect(screen.getByRole("heading", { name: "Big" })).toHaveClass("text-xl");
    expect(screen.getByRole("heading", { name: "Medium" }).tagName).toBe("H4");
    expect(screen.getByRole("heading", { name: "Medium" })).toHaveClass("text-lg");
    expect(screen.getByRole("heading", { name: "Small" }).tagName).toBe("H6");
  });

  it("opens a web link in a new tab and says so", () => {
    renderMarkdown("[GitHub](https://github.com/a)");

    const link = screen.getByRole("link", { name: "GitHub (opens in a new tab)" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("sends a link to a page of the site through the router, in the same tab", () => {
    renderMarkdown("[About](/about)");

    const link = screen.getByRole("link", { name: "About" });
    expect(link).toHaveAttribute("data-router-link");
    expect(link).not.toHaveAttribute("target");
  });

  it("keeps a phone link, in the same tab", () => {
    renderMarkdown("[Call me](tel:+37493310039)");

    const link = screen.getByRole("link", { name: "Call me" });
    expect(link).toHaveAttribute("href", "tel:+37493310039");
    expect(link).not.toHaveAttribute("target");
  });

  it("never renders raw HTML from the source", () => {
    const { container } = renderMarkdown('Text <img src="x" onerror="alert(1)"> more.');

    expect(container.querySelector("img")).toBeNull();
  });

  it("renders a pasted escape as its character and a hard break as br", () => {
    const { container } = renderMarkdown("Line one  \nline two \\- done\\.");

    expect(container.querySelector("p")?.innerHTML).toBe("Line one<br>\nline two - done.");
  });
});
