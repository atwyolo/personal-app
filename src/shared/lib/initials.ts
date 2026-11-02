const INITIALS_LENGTH = 2;

/** First letters of the first two words: `Mikhail Aleksandrov` gives `MA`. A translated name gives its own initials. */
export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, INITIALS_LENGTH)
    .map((word) => [...word][0] ?? "")
    .join("")
    .toUpperCase();
