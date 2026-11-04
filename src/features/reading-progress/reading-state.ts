const LINE = 0.4;

interface ReadingStateParams {
  sections: { top: number; height: number }[];
  viewportHeight: number;
  atPageEnd: boolean;
}

interface ReadingState {
  active: number;
  progress: number[];
}

const clamp = (value: number): number => Math.min(Math.max(value, 0), 1);

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
