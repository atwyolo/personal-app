import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFoldingPanel } from "./useFoldingPanel";

const measured = { stuck: false, hidden: false };
vi.mock("./useIsStuck", () => ({ useIsStuck: () => ({ stuck: measured.stuck }) }));
vi.mock("./useHideOnScroll", () => ({ useHideOnScroll: () => ({ hidden: measured.hidden }) }));

const fold = (focused = false) => renderHook(() => useFoldingPanel({ ref: { current: null }, focused })).result.current;

afterEach(() => {
  measured.stuck = false;
  measured.hidden = false;
});

describe("useFoldingPanel", () => {
  it("never folds a panel that is not stuck, whatever the direction", () => {
    measured.hidden = true;

    expect(fold()).toEqual({ stuck: false, collapsed: false });
  });

  it("folds a stuck panel while the visitor scrolls down", () => {
    measured.stuck = true;
    measured.hidden = true;

    expect(fold()).toEqual({ stuck: true, collapsed: true });
  });

  it("unfolds a stuck panel while the visitor scrolls up", () => {
    measured.stuck = true;

    expect(fold()).toEqual({ stuck: true, collapsed: false });
  });

  it("never folds while the panel's field has focus: the keyboard is open", () => {
    measured.stuck = true;
    measured.hidden = true;

    expect(fold(true)).toEqual({ stuck: true, collapsed: false });
  });
});
