export type MessageLeaf = string | null;

export interface MessagesTree {
  [key: string]: MessageLeaf | MessagesTree;
}

const isTree = (value: MessageLeaf | MessagesTree | undefined): value is MessagesTree =>
  typeof value === "object" && value !== null;

export const mergeMessages = <T extends MessagesTree>(fallback: T, overrides: MessagesTree): T => {
  const result: MessagesTree = { ...fallback };

  for (const [key, value] of Object.entries(overrides)) {
    const base = result[key];

    if (value === null || value === "") continue;

    result[key] = isTree(value) && isTree(base) ? mergeMessages(base, value) : value;
  }

  return result as T;
};
