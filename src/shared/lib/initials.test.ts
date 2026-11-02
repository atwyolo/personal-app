import { describe, expect, it } from "vitest";

import { getInitials } from "./initials";

describe("getInitials", () => {
  it.each([
    ["Mikhail Aleksandrov", "MA"],
    ["Михаил Александров", "МА"],
    ["Mikhail", "M"],
    ["  Mikhail   Aleksandrov  Jr", "MA"],
    ["", ""],
  ])("turns %j into %j", (name, initials) => {
    expect(getInitials(name)).toBe(initials);
  });
});
