// @vitest-environment node
import { describe, expect, it } from "vitest";

import { assertAllowedMarkdown, markdownToPlainText } from "./markdown";

const file = "messages/en/about/who.md";

describe("assertAllowedMarkdown", () => {
  it("accepts what a Google Docs Markdown copy gives: headings, hard breaks, escapes, lists, emphasis, links", () => {
    const source = "# Title\n\nLine one  \nline two \\- escaped\\.\n\n1. a\n2. *b* **c** [d](https://x.dev)\n\n- e\n";

    expect(() => assertAllowedMarkdown(source, file)).not.toThrow();
  });

  it.each([
    ["<img src=x onerror=alert(1)>", "html"],
    ["![a](b.png)", "image"],
    ["> q", "blockquote"],
    ["```\ncode\n```", "code"],
    ["`code`", "inlineCode"],
    ["---\n\ntext", "thematicBreak"],
  ])("rejects %j as %s, with the file and the line", (source, type) => {
    expect(() => assertAllowedMarkdown(`Fine.\n\n${source}`, file)).toThrow(
      `Unsupported Markdown "${type}" in ${file}, line 3`,
    );
  });
});

describe("markdownToPlainText", () => {
  it("keeps the text of every block, one per line", () => {
    expect(markdownToPlainText("Lead.\n\n**Results:**\n\n- One\n- Two")).toBe("Lead.\nResults:\nOne\nTwo");
  });

  it("keeps the text of a link and drops the escapes", () => {
    expect(markdownToPlainText("See [the site](https://x.dev) \\- now\\.")).toBe("See the site - now.");
  });
});
