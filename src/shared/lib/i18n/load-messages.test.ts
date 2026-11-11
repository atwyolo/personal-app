import { describe, expect, it } from "vitest";

import { locales } from "@/shared/lib/locales";

import { loadMergedMessages, loadMessages } from "./load-messages";
import type { MessagesTree } from "./merge-messages";

const keyPaths = (tree: MessagesTree, prefix = ""): string[] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}.${key}` : key;

    return typeof value === "object" && value !== null ? keyPaths(value, name) : [name];
  });

describe("loadMergedMessages", () => {
  it.each(locales)("gives %s the key paths of English", async (locale) => {
    const [en, merged] = await Promise.all([loadMessages("en"), loadMergedMessages(locale)]);

    expect(keyPaths(merged).sort()).toEqual(keyPaths(en).sort());
  });
});
