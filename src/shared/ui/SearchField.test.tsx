import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { SearchField } from "./SearchField";

describe("SearchField", () => {
  // jsdom's role table does not know `<search>` yet, so the element is checked here and its `search` landmark role
  // in a real browser by `e2e/skills.spec.ts`. An explicit `role="search"` would only repeat what browsers give it.
  it("holds a labelled search box in a search element", () => {
    const { container } = render(<SearchField label="Search skills" value="" onValueChange={() => {}} />);

    expect(container.querySelector("search")).toContainElement(screen.getByRole("searchbox", { name: "Search skills" }));
  });

  it("reports every change of the text", async () => {
    const onValueChange = vi.fn();
    const Controlled = () => {
      const [value, setValue] = useState("");

      return (
        <SearchField
          label="Search skills"
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange(next);
          }}
        />
      );
    };
    render(<Controlled />);

    await userEvent.type(screen.getByRole("searchbox"), "do");

    expect(onValueChange).toHaveBeenNthCalledWith(1, "d");
    expect(onValueChange).toHaveBeenNthCalledWith(2, "do");
    expect(screen.getByRole("searchbox")).toHaveValue("do");
  });
});
