// @vitest-environment node
import { describe, expect, it } from "vitest";

import { readAboutPairs } from "./about";
import { writeContentTree } from "./test-tree";

const pair = (sort: number, title: string) =>
  `---\nsort: ${sort}\nlinkText: ${title}\nquestionTitle: ${title}\nquestionMessage: ${title}?\nanswerTitle: Answer.\n---\n\nThe **answer**.\n`;

describe("readAboutPairs", () => {
  it("returns the pairs by sort, then slug, with the Markdown answer", () => {
    const root = writeContentTree({
      "en/about/who.md": pair(1, "Who"),
      "en/about/how.md": pair(0, "How"),
      "en/about/aim.md": pair(1, "Aim"),
    });

    const pairs = readAboutPairs(root, "en");

    expect(pairs.map((p) => p.slug)).toEqual(["how", "aim", "who"]);
    expect(pairs[0]).toEqual({
      slug: "how",
      linkText: "How",
      questionTitle: "How",
      questionMessage: "How?",
      answerTitle: "Answer.",
      answerMessage: "The **answer**.",
    });
  });

  it("gives a locale without translations the English pairs", () => {
    const root = writeContentTree({ "en/about/who.md": pair(0, "Who") });

    expect(readAboutPairs(root, "ja")[0].questionMessage).toBe("Who?");
  });
});
