/**
 * Compares strings by UTF-16 code units: uppercase before lowercase, `RTK Query` before `React`. The database sorted
 * names this way (collation `C`), so moving the content to files kept every list in the order visitors saw.
 * `localeCompare` would put `styled-components` among the S's instead of last.
 */
export const byCodePoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
