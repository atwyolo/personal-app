/** A leaf of the messages tree: UI strings, and the URLs, flags and numbers of `Meta.*`. */
export type MessageLeaf = string | number | boolean | null;

/** A next-intl messages tree: nested objects with scalar leaves. */
export interface MessagesTree {
  [key: string]: MessageLeaf | MessagesTree;
}

const isTree = (value: MessageLeaf | MessagesTree | undefined): value is MessagesTree =>
  typeof value === "object" && value !== null;

/**
 * Deep-merges a locale's messages over the English fallback, so a locale file only has to contain
 * what is translated. Missing keys, empty strings and `null` fall back to English; booleans and numbers
 * override. Returns a new object.
 */
export const mergeMessages = <T extends MessagesTree>(fallback: T, overrides: MessagesTree): T => {
  const result: MessagesTree = { ...fallback };

  for (const [key, value] of Object.entries(overrides)) {
    const base = result[key];

    if (value === null || value === "") continue;

    result[key] = isTree(value) && isTree(base) ? mergeMessages(base, value) : value;
  }

  return result as T;
};
