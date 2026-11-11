import { describe, expect, it } from "vitest";
import { formatMonthYear, getDurationYears, getYearSpan } from "./period";

const today = "2026-10-30";

describe("formatMonthYear", () => {
  it("reads the month and year from the date string", () => {
    expect(formatMonthYear("2024-11-01")).toBe("11/2024");
  });

  it("keeps the first and the last day of a year in their own year", () => {
    expect(formatMonthYear("2024-01-01")).toBe("01/2024");
    expect(formatMonthYear("2024-12-31")).toBe("12/2024");
  });
});

describe("getDurationYears", () => {
  it("counts both the first and the last month, so a job from November to October is two years", () => {
    expect(getDurationYears("2024-11-01", "2026-10-01", today)).toBe(2);
  });

  it("rounds to one decimal", () => {
    expect(getDurationYears("2023-08-01", "2024-11-01", today)).toBe(1.3);
  });

  it("counts twelve months as exactly one year", () => {
    expect(getDurationYears("2023-03-01", "2024-02-01", today)).toBe(1);
  });

  it("rounds eleven months to 0.9", () => {
    expect(getDurationYears("2023-03-01", "2024-01-01", today)).toBe(0.9);
  });

  it("counts months across a year boundary", () => {
    expect(getDurationYears("2023-12-01", "2024-01-01", today)).toBe(0.2);
  });

  it("uses today for a job without an end date", () => {
    expect(getDurationYears("2025-11-01", null, today)).toBe(1);
  });

  it("counts the running month for a job that started this month", () => {
    expect(getDurationYears("2026-10-01", null, today)).toBe(0.1);
  });
});

describe("getYearSpan", () => {
  const jobs = [
    { startDate: "2024-11-01", endDate: "2026-10-01" },
    { startDate: "2023-08-01", endDate: "2024-11-01" },
    { startDate: "2021-07-01", endDate: "2023-08-01" },
  ];

  it("spans the earliest start and the latest end", () => {
    expect(getYearSpan(jobs, today)).toEqual({ from: 2021, to: 2026 });
  });

  it("does not depend on the order of the jobs", () => {
    expect(getYearSpan([...jobs].reverse(), today)).toEqual({ from: 2021, to: 2026 });
  });

  it("reaches today with a running job", () => {
    expect(getYearSpan([{ startDate: "2024-11-01", endDate: null }], "2027-02-01")).toEqual({ from: 2024, to: 2027 });
  });

  it("has no span without jobs", () => {
    expect(getYearSpan([], today)).toBeNull();
  });
});
