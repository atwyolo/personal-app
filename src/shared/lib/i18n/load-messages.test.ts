import { describe, expect, it } from "vitest";

import { loadMergedMessages, loadMessages } from "./load-messages";

describe("loadMergedMessages", () => {
  it("gives a locale without translations the complete English tree", async () => {
    const [en, ja] = await Promise.all([loadMessages("en"), loadMergedMessages("ja")]);

    expect(ja).toEqual(en);
  });
});
