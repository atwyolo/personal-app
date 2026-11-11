import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeColorSync } from "./ThemeColorSync";

const theme = vi.hoisted(() => ({ resolvedTheme: undefined as string | undefined }));

vi.mock("next-themes", () => ({ useTheme: () => theme }));

const tags = () => [...document.head.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];

describe("ThemeColorSync", () => {
  beforeEach(() => {
    document.head.innerHTML =
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">' +
      '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#181e3b">';
  });

  afterEach(() => {
    theme.resolvedTheme = undefined;
  });

  it("sets both tags to the dark colour when the resolved theme is dark", () => {
    theme.resolvedTheme = "dark";
    render(<ThemeColorSync />);

    expect(tags().map((tag) => tag.content)).toEqual(["#181e3b", "#181e3b"]);
  });

  it("follows a change of theme", () => {
    theme.resolvedTheme = "dark";
    const { rerender } = render(<ThemeColorSync />);

    theme.resolvedTheme = "light";
    rerender(<ThemeColorSync />);

    expect(tags().map((tag) => tag.content)).toEqual(["#ffffff", "#ffffff"]);
  });

  it("re-applies the colour when a navigation replaces the tags", async () => {
    theme.resolvedTheme = "light";
    render(<ThemeColorSync />);

    document.head.innerHTML =
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">' +
      '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#181e3b">';

    await waitFor(() => expect(tags().map((tag) => tag.content)).toEqual(["#ffffff", "#ffffff"]));
  });

  it("does nothing before the theme is resolved", () => {
    render(<ThemeColorSync />);

    expect(tags().map((tag) => tag.content)).toEqual(["#ffffff", "#181e3b"]);
  });

  it("renders nothing", () => {
    theme.resolvedTheme = "light";
    const { container } = render(<ThemeColorSync />);

    expect(container).toBeEmptyDOMElement();
  });
});
