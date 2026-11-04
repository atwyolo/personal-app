import type { ExperienceEntry } from "@/content/experience";

/** A job with the texts every part of the page shows, formatted once. */
export interface ProjectJob extends ExperienceEntry {
  /** "11/2024 – 10/2026". */
  period: string;
  /** "2 years". */
  duration: string;
}

/** Marks job 0 in the server HTML; `ReadingProgress` takes over from there. */
export const getJobAttributes = (index: number) => ({
  "data-job": index,
  "data-active": index === 0 ? "" : undefined,
});
