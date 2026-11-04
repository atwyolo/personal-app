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
    ["<img src=x onerror=alert(1)>", "html", 3],
    ["![a](b.png)", "image", 3],
    ["> q", "blockquote", 3],
    ["```\ncode\n```", "code", 3],
    ["`code`", "inlineCode", 3],
    ["---\n\ntext", "thematicBreak", 3],
    // GFM, which Google Docs' "Copy as Markdown" emits: parsed so it can be rejected, never shown as raw pipes or tildes.
    ["| a | b |\n|---|---|\n| 1 | 2 |", "table", 3],
    ["~~gone~~", "delete", 3],
    ["- [ ] todo", "task list item", 3],
    ["Text[^1]\n\n[^1]: Note.", "footnoteReference", 3],
    // A nested list would sit beside its parent's text: the bullets are a flex row.
    ["- parent\n  - child", "list inside a list", 4],
  ])("rejects %j as %s, with the file and the line", (source, type, line) => {
    expect(() => assertAllowedMarkdown(`Fine.\n\n${source}`, file)).toThrow(
      `Unsupported Markdown "${type}" in ${file}, line ${line}`,
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
