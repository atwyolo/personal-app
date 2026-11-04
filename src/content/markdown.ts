import "server-only";

import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";

/**
 * The Markdown the site renders (owner's decision 14 in docs/specs/2026-11-04-content-in-files-design.md): CommonMark
 * paragraphs, emphasis, links, lists, hard breaks and headings. Anything else would render unstyled on the site or
 * break the CV built from the same files, so it fails the build.
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

const walk = (node: Nodes, visit: (node: Nodes) => void) => {
  visit(node);
  if ("children" in node) for (const child of node.children) walk(child, visit);
};

/** Throws on the first node outside the allowed set, with the file and the line. */
export const assertAllowedMarkdown = (source: string, file: string): void => {
  walk(fromMarkdown(source), (node) => {
    if (!allowed.has(node.type)) {
      throw new Error(`Unsupported Markdown "${node.type}" in ${file}, line ${node.position?.start.line ?? "?"}`);
    }
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

  walk(fromMarkdown(source), (node) => {
    if (node.type === "paragraph" || node.type === "heading") lines.push(inlineText(node));
  });

  return lines.join("\n");
};
