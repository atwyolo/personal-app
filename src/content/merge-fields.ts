type Fields = Record<string, unknown>;

const isMissing = (value: unknown) => value === null || value === undefined || value === "";

const isNode = (value: unknown): value is Fields => typeof value === "object" && value !== null && !Array.isArray(value);

export const mergeFields = <T extends Fields>(en: T, locale: Fields | undefined, lists: Record<string, string> = {}): T => {
  const result: Fields = { ...en };

  for (const [field, value] of Object.entries(locale ?? {})) {
    if (isMissing(value)) continue;

    const itemKey = lists[field];
    const base = en[field];

    if (itemKey && Array.isArray(base) && Array.isArray(value)) {
      const items = base as Fields[];
      for (const item of value as Fields[]) {
        if (!items.some((candidate) => candidate[itemKey] === item[itemKey])) {
          throw new Error(`${field}: no English item with ${itemKey} "${String(item[itemKey])}"`);
        }
      }
      result[field] = items.map((item) => mergeFields(item, (value as Fields[]).find((v) => v[itemKey] === item[itemKey])));
    } else if (isNode(base) && isNode(value)) {
      result[field] = mergeFields(base, value);
    } else {
      result[field] = value;
    }
  }

  return result as T;
};
