/** ISO-8601 week helpers used by the task queue and weekly planning modules. */

export interface WeekRef {
  year: number;
  week: number;
  tag: string; // e.g. "W29"
}

/** ISO week number (1–53) and ISO week-year for a given date. */
export function isoWeek(date: Date): WeekRef {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Thursday in current week decides the year.
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
  const year = d.getUTCFullYear();
  return { year, week, tag: `W${week}` };
}

export function currentWeek(): WeekRef {
  return isoWeek(new Date());
}

/** The week after the given one, wrapping 52/53 → next year, week 1. */
export function nextWeek(ref: WeekRef): WeekRef {
  const weeksInYear = isoWeek(new Date(Date.UTC(ref.year, 11, 28))).week; // Dec 28 is always in the last ISO week
  if (ref.week >= weeksInYear) return { year: ref.year + 1, week: 1, tag: 'W1' };
  const w = ref.week + 1;
  return { year: ref.year, week: w, tag: `W${w}` };
}

export function prevWeek(ref: WeekRef): WeekRef {
  if (ref.week <= 1) {
    const prevYear = ref.year - 1;
    const last = isoWeek(new Date(Date.UTC(prevYear, 11, 28))).week;
    return { year: prevYear, week: last, tag: `W${last}` };
  }
  const w = ref.week - 1;
  return { year: ref.year, week: w, tag: `W${w}` };
}
