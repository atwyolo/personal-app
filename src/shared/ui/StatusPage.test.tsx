import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { StatusPage } from "./StatusPage";

const texts = { label: "Error 500", title: "Something broke", text: "Reload the page." };

describe("StatusPage", () => {
  it("renders one main and one h1 with the texts", () => {
    render(
      <StatusPage code={<span>500</span>} {...texts}>
        <button type="button">Reload</button>
      </StatusPage>,
    );

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Something broke");
    expect(screen.getByText("Error 500")).toBeVisible();
    expect(screen.getByText("Reload the page.")).toBeVisible();
  });

  it("makes the title focusable from code only when a ref is given", () => {
    const { rerender } = render(
      <StatusPage code={null} {...texts}>
        {null}
      </StatusPage>,
    );
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveAttribute("tabindex");

    const ref = createRef<HTMLHeadingElement>();
    rerender(
      <StatusPage code={null} {...texts} titleRef={ref}>
        {null}
      </StatusPage>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute("tabindex", "-1");
    expect(ref.current).toBe(screen.getByRole("heading", { level: 1 }));
  });

  it("renders the detail and the action after the text", () => {
    render(
      <StatusPage code={null} {...texts} detail={<p>Error ID: 7f3a</p>}>
        <button type="button">Reload</button>
      </StatusPage>,
    );

    const text = screen.getByText("Reload the page.");
    const detail = screen.getByText("Error ID: 7f3a");
    const action = screen.getByRole("button", { name: "Reload" });
    expect(text.compareDocumentPosition(detail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(detail.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
