import "server-only";

import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

/**
 * The Markdown the site renders (owner's decision 14 in docs/specs/2026-11-04-content-in-files-design.md): CommonMark
 * paragraphs, emphasis, links, lists, hard breaks and headings. Anything else would render unstyled on the site or
 * break the CV built from the same files, so it fails the build.
 *
 * The source is parsed with GFM although the site renders CommonMark: Google Docs' "Copy as Markdown" emits GFM tables,
 * strikethrough and task lists, which a CommonMark parser reads as plain text and would let through as raw pipes and
 * tildes. Parsing them is the only way to see them and reject them.
 */
const allowed = new Set<Nodes["type"]>([
  "root",
  "paragraph",
  "text",
  "strong",
  "emphasis",
  "link",
  "list",
  "listItem",
  "break",
  "heading",
]);

const parse = (source: string) => fromMarkdown(source, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });

const walk = (node: Nodes, visit: (node: Nodes, inListItem: boolean) => void, inListItem = false) => {
  visit(node, inListItem);
  if ("children" in node) for (const child of node.children) walk(child, visit, inListItem || node.type === "listItem");
};

/** What a node is called in the error, or `null` when the site renders it. */
const unsupported = (node: Nodes, inListItem: boolean): string | null => {
  if (!allowed.has(node.type)) return node.type;
  // The bullets are a flex row, so a nested list would sit beside its parent's text (owner: reject, 2026-11-04).
  if (node.type === "list" && inListItem) return "list inside a list";
  // GFM marks `- [ ] todo` with `checked`; CommonMark would show the brackets as text.
  if (node.type === "listItem" && typeof node.checked === "boolean") return "task list item";
  return null;
};

/** Throws on the first node the site does not render, with the file and the line. */
export const assertAllowedMarkdown = (source: string, file: string): void => {
  walk(parse(source), (node, inListItem) => {
    const name = unsupported(node, inListItem);
    if (name) throw new Error(`Unsupported Markdown "${name}" in ${file}, line ${node.position?.start.line ?? "?"}`);
  });
};

const inlineText = (node: Nodes): string => {
  if (node.type === "text") return node.value;
  if (node.type === "break") return " ";
  return "children" in node ? node.children.map(inlineText).join("") : "";
};

/** The text of every block, one per line: for meta descriptions and structured data. */
export const markdownToPlainText = (source: string): string => {
  const lines: string[] = [];

  walk(parse(source), (node) => {
    if (node.type === "paragraph" || node.type === "heading") lines.push(inlineText(node));
  });

  return lines.join("\n");
};
