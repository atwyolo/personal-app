const MONTHS_IN_YEAR = 12;

const getMonthIndex = (date: string): number => {
  const [year, month] = date.split("-").map(Number);

  return year * MONTHS_IN_YEAR + month;
};

const getYear = (date: string): number => Number(date.slice(0, 4));

export const formatMonthYear = (date: string): string => {
  const [year, month] = date.split("-");

  return `${month}/${year}`;
};

export const getDurationYears = (startDate: string, endDate: string | null, today: string): number => {
  const months = getMonthIndex(endDate ?? today) - getMonthIndex(startDate) + 1;

  return Math.round((months / MONTHS_IN_YEAR) * 10) / 10;
};

export const getYearSpan = (
  periods: { startDate: string; endDate: string | null }[],
  today: string,
): { from: number; to: number } | null => {
  if (periods.length === 0) return null;

  return {
    from: Math.min(...periods.map((period) => getYear(period.startDate))),
    to: Math.max(...periods.map((period) => getYear(period.endDate ?? today))),
  };
};
