import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { themeColors } from "./theme-colors";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

const cardIn = (selector: string): string | undefined => {
  const block = css.match(new RegExp(`^${selector.replace(".", "\\.")} \\{([^}]*)\\}`, "m"))?.[1];

  return block?.match(/--card:\s*(#[0-9a-f]+);/i)?.[1].toLowerCase();
};

describe("themeColors", () => {
  it("matches --card of globals.css in both themes", () => {
    expect(themeColors.light).toBe(cardIn(":root"));
    expect(themeColors.dark).toBe(cardIn(".dark"));
  });
});
