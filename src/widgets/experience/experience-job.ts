import type { ExperienceEntry } from "@/content/experience";

export interface ExperienceJob extends ExperienceEntry {
  period: string;
  duration: string;
}

export const getJobAttributes = (index: number) => ({
  "data-job": index,
  "data-active": index === 0 ? "" : undefined,
});
