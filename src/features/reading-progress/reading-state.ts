/** The reading line: a section is being read once its top rises above this share of the window. */
const LINE = 0.4;

interface ReadingStateParams {
  /** Each section's top relative to the window and its height, in px, in reading order. */
  sections: { top: number; height: number }[];
  viewportHeight: number;
  /** The last section may never reach the line, so the end of the page finishes everything. */
  atPageEnd: boolean;
}

interface ReadingState {
  active: number;
  /** Per section, from 0 to 1. */
  progress: number[];
}

const clamp = (value: number): number => Math.min(Math.max(value, 0), 1);

/** Which job is being read and how far along each one is. */
export const getReadingState = (params: ReadingStateParams): ReadingState => {
  const { sections, viewportHeight, atPageEnd } = params;

  if (atPageEnd) return { active: Math.max(sections.length - 1, 0), progress: sections.map(() => 1) };

  const line = viewportHeight * LINE;
  const active = sections.findLastIndex((section) => section.top < line);

  return {
    active: Math.max(active, 0),
    progress: sections.map(({ top, height }) => (height > 0 ? clamp((line - top) / height) : 0)),
  };
};
