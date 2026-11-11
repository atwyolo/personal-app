import { describe, expect, it } from "vitest";

import { formatAppVersion } from "./app-version";

describe("formatAppVersion", () => {
  it("appends the short commit as semver build metadata", () => {
    expect(formatAppVersion("0.2.0", "4eee3cf1a2b3c4d5e6f708192a3b4c5d6e7f8091")).toBe("0.2.0+4eee3cf");
  });

  it("returns the bare version when the build has no commit", () => {
    expect(formatAppVersion("0.2.0", undefined)).toBe("0.2.0");
  });

  it("treats an empty commit as no commit", () => {
    expect(formatAppVersion("0.2.0", "")).toBe("0.2.0");
  });
});
