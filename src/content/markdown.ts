import "server-only";

import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

import { locales } from "@/shared/lib/locales";

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

const unsupported = (node: Nodes, inListItem: boolean): string | null => {
  if (!allowed.has(node.type)) return node.type;
  if (node.type === "list" && inListItem) return "list inside a list";
  if (node.type === "listItem" && typeof node.checked === "boolean") return "task list item";
  return null;
};

const ALLOWED_LINK = /^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i;

const localePrefix = (url: string) => locales.find((locale) => url === `/${locale}` || url.startsWith(`/${locale}/`) || url.startsWith(`/${locale}#`));

const linkProblem = (url: string): string | null => {
  if (!ALLOWED_LINK.test(url)) return "";
  const locale = localePrefix(url);
  if (locale) return `: write "${url.slice(locale.length + 1) || "/"}", one file serves every locale`;
  return null;
};

export const assertAllowedMarkdown = (source: string, file: string): void => {
  walk(parse(source), (node, inListItem) => {
    const line = node.position?.start.line ?? "?";
    const name = unsupported(node, inListItem);
    if (name) throw new Error(`Unsupported Markdown "${name}" in ${file}, line ${line}`);
    if (node.type === "link") {
      const problem = linkProblem(node.url);
      if (problem !== null) throw new Error(`Unsupported link "${node.url}" in ${file}, line ${line}${problem}`);
    }
  });
};
