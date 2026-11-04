import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./ThemeProvider";

describe("ThemeProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders a client-side theme script without React's script tag error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );

    expect(screen.getByText("content")).toBeInTheDocument();
    const messages = consoleError.mock.calls.map((args) => String(args[0]));
    expect(messages.filter((m) => m.includes("Encountered a script tag"))).toEqual([]);
  });
});
