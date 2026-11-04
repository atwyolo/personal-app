const INITIALS_LENGTH = 2;

export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, INITIALS_LENGTH)
    .map((word) => [...word][0] ?? "")
    .join("")
    .toUpperCase();
