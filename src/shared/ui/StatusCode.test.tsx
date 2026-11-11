import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusCode } from "./StatusCode";

const code = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-status-code]")!;

describe("StatusCode", () => {
  it("hides the number from assistive technology", () => {
    const { container } = render(<StatusCode variant="error" />);

    expect(code(container)).toHaveAttribute("aria-hidden", "true");
  });

  it("draws 4, the tile, 4 for not-found", () => {
    const { container } = render(<StatusCode variant="not-found" />);
    const glyphs = [...code(container).children];

    expect(glyphs).toHaveLength(3);
    expect(glyphs[0]).toHaveTextContent("4");
    expect(glyphs[1]).toHaveTextContent("");
    expect(glyphs[2]).toHaveTextContent("4");
    expect(code(container)).toHaveAttribute("data-not-found-code");
  });

  it("draws 5, 0, then the cracked tile for error", () => {
    const { container } = render(<StatusCode variant="error" />);
    const glyphs = [...code(container).children];

    expect(glyphs.map((glyph) => glyph.textContent)).toEqual(["5", "0", ""]);
    expect(glyphs[2].querySelector("svg path")).toHaveAttribute("d", "M58 -2 L50 22 L62 34 L46 52 L58 66 L44 102");
    expect(code(container)).not.toHaveAttribute("data-not-found-code");
  });
});
