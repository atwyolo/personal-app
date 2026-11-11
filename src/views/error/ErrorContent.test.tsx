import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorContent } from "./ErrorContent";
import { errorTexts } from "./error-texts";

const texts = errorTexts.en;
const reload = vi.fn();
const originalLocation = window.location;

describe("ErrorContent", () => {
  beforeEach(() => {
    Object.defineProperty(window, "location", { value: { ...originalLocation, reload }, configurable: true });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { value: originalLocation, configurable: true });
    reload.mockReset();
    vi.restoreAllMocks();
  });

  it("shows the texts and a hidden 500", () => {
    const { container } = render(<ErrorContent error={new Error("x")} texts={texts} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(texts.title);
    expect(screen.getByText(texts.label)).toBeVisible();
    expect(screen.getByText(texts.text)).toBeVisible();
    expect(container.querySelector("[data-status-code]")).toHaveTextContent("50");
    expect(container.querySelector("[data-error-page]")).not.toBeNull();
  });

  it("shows the Error ID only with a digest", () => {
    const { rerender } = render(<ErrorContent error={Object.assign(new Error("x"), { digest: "7f3a9c21" })} texts={texts} />);
    expect(screen.getByText("7f3a9c21")).toBeVisible();
    expect(screen.getByText(texts.errorId, { exact: false })).toBeVisible();

    rerender(<ErrorContent error={new Error("x")} texts={texts} />);
    expect(screen.queryByText(texts.errorId, { exact: false })).toBeNull();
  });

  it("never shows the message", () => {
    render(<ErrorContent error={Object.assign(new Error("secret detail"), { digest: "1" })} texts={texts} />);

    expect(screen.queryByText(/secret detail/)).toBeNull();
  });

  it.each([["a string", "boom"], ["null", null]])("renders without an Error ID when the thrown value is %s", (_, value) => {
    render(<ErrorContent error={value} texts={texts} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(texts.title);
    expect(screen.queryByText(texts.errorId, { exact: false })).toBeNull();
  });

  it("moves focus to the title", () => {
    render(<ErrorContent error={new Error("x")} texts={texts} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("turns the button busy and reloads", () => {
    render(<ErrorContent error={new Error("x")} texts={texts} />);

    const button = screen.getByRole("button", { name: texts.reload });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-busy");
    expect(button).toHaveTextContent(texts.reloading);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads once on a double click", () => {
    render(<ErrorContent error={new Error("x")} texts={texts} />);

    const button = screen.getByRole("button", { name: texts.reload });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("sets the title and noindex", () => {
    render(<ErrorContent error={new Error("x")} texts={texts} />);

    expect(document.title).toBe(texts.metaTitle);
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  });

  it("logs the error", () => {
    const error = new Error("x");
    render(<ErrorContent error={error} texts={texts} />);

    expect(console.error).toHaveBeenCalledWith(error);
  });
});
