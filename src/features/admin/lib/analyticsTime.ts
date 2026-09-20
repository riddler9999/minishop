export const YANGON_TZ = 'Asia/Yangon';
const YANGON_OFFSET_MS = 6.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function yangonDateParts(date: Date): {year: number; month: number; day: number} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: YANGON_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return {year: value('year'), month: value('month'), day: value('day')};
}

export function yangonStartOfDay(date: Date): Date {
  const {year, month, day} = yangonDateParts(date);
  return new Date(Date.UTC(year, month - 1, day) - YANGON_OFFSET_MS);
}

export function yangonDayKey(date: Date): string {
  const {year, month, day} = yangonDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getYangonAnalyticsWindow(now = new Date()) {
  const todayStart = yangonStartOfDay(now);
  const currentStart = new Date(todayStart.getTime() - 6 * DAY_MS);
  const previousStart = new Date(todayStart.getTime() - 13 * DAY_MS);
  const previousEnd = new Date(todayStart.getTime() - 7 * DAY_MS);
  const currentEnd = new Date(todayStart.getTime() + DAY_MS);
  return {todayStart, currentStart, currentEnd, previousStart, previousEnd};
}

export function addYangonDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}
