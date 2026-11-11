import { afterEach, describe, expect, it, vi } from "vitest";

import { readTheme } from "./read-theme";

const mockSystem = (dark: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: dark, media: query }) as MediaQueryList);

describe("readTheme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("follows a stored choice", () => {
    mockSystem(false);
    localStorage.setItem("theme", "dark");

    expect(readTheme()).toBe("dark");
  });

  it("follows the system without a stored choice", () => {
    mockSystem(true);
    localStorage.setItem("theme", "system");

    expect(readTheme()).toBe("dark");
  });

  it("follows the system when the storage is blocked", () => {
    mockSystem(true);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(readTheme()).toBe("dark");
  });
});
