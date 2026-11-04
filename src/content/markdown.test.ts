import { describe, expect, it } from "vitest";

import { assertAllowedMarkdown } from "./markdown";

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
    ["| a | b |\n|---|---|\n| 1 | 2 |", "table", 3],
    ["~~gone~~", "delete", 3],
    ["- [ ] todo", "task list item", 3],
    ["Text[^1]\n\n[^1]: Note.", "footnoteReference", 3],
    ["- parent\n  - child", "list inside a list", 4],
  ])("rejects %j as %s, with the file and the line", (source, type, line) => {
    expect(() => assertAllowedMarkdown(`Fine.\n\n${source}`, file)).toThrow(
      `Unsupported Markdown "${type}" in ${file}, line ${line}`,
    );
  });
});

describe("links in Markdown", () => {
  it.each([
    "https://github.com/a",
    "http://old-site.example",
    "mailto:me@example.com",
    "tel:+37493310039",
    "/about",
    "/experience#glovo",
    "/",
    "#who",
  ])("accepts %s", (url) => {
    expect(() => assertAllowedMarkdown(`[link](${url})`, file)).not.toThrow();
  });

  it("rejects a site link that names the locale, suggesting the path without it", () => {
    expect(() => assertAllowedMarkdown("Fine.\n\n[About](/en/about)", file)).toThrow(
      `Unsupported link "/en/about" in ${file}, line 3: write "/about", one file serves every locale`,
    );
  });

  it.each(["about", "javascript:alert(1)", "ftp://files.example", "//cdn.example/x"])("rejects %s", (url) => {
    expect(() => assertAllowedMarkdown(`Fine.\n\n[link](${url})`, file)).toThrow(`Unsupported link "${url}" in ${file}, line 3`);
  });
});
