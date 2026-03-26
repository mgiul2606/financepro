/**
 * Budget utility functions.
 *
 * getCurrentBudgetPeriod mirrors the backend _get_current_period logic
 * so the frontend details modal shows the same date window.
 */

interface PeriodResult {
  periodStart: Date;
  periodEnd: Date;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/**
 * Calculate the current period window for a budget based on its period type
 * and start date. Matches the backend's _get_current_period logic.
 */
export function getCurrentBudgetPeriod(
  periodType: string,
  startDateStr: string,
  endDateStr?: string | null,
): PeriodResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const budgetStart = new Date(startDateStr);
  budgetStart.setHours(0, 0, 0, 0);

  if (periodType === 'custom') {
    const end = endDateStr ? new Date(endDateStr) : today;
    end.setHours(0, 0, 0, 0);
    return { periodStart: budgetStart, periodEnd: end };
  }

  if (periodType === 'daily') {
    return { periodStart: new Date(today), periodEnd: new Date(today) };
  }

  if (periodType === 'weekly') {
    const diffDays = Math.floor((today.getTime() - budgetStart.getTime()) / 86400000);
    if (diffDays < 0) {
      const end = new Date(budgetStart);
      end.setDate(end.getDate() + 6);
      return { periodStart: new Date(budgetStart), periodEnd: end };
    }
    const periodNum = Math.floor(diffDays / 7);
    const periodStart = new Date(budgetStart);
    periodStart.setDate(periodStart.getDate() + periodNum * 7);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6);
    return { periodStart, periodEnd };
  }

  if (periodType === 'monthly') {
    const startDay = budgetStart.getDate();
    const y = today.getFullYear();
    const m = today.getMonth(); // 0-based

    let periodStart = new Date(y, m, clampDay(y, m, startDay));
    if (today < periodStart) {
      // Previous period
      const pm = m === 0 ? 11 : m - 1;
      const py = m === 0 ? y - 1 : y;
      periodStart = new Date(py, pm, clampDay(py, pm, startDay));
    }

    // Next period start
    const nm = periodStart.getMonth() === 11 ? 0 : periodStart.getMonth() + 1;
    const ny = periodStart.getMonth() === 11 ? periodStart.getFullYear() + 1 : periodStart.getFullYear();
    const nextStart = new Date(ny, nm, clampDay(ny, nm, startDay));
    const periodEnd = new Date(nextStart);
    periodEnd.setDate(periodEnd.getDate() - 1);

    return { periodStart, periodEnd };
  }

  if (periodType === 'quarterly') {
    const startDay = budgetStart.getDate();
    const startMonth = budgetStart.getMonth();
    const startYear = budgetStart.getFullYear();

    const monthsSince = (today.getFullYear() - startYear) * 12 + (today.getMonth() - startMonth);
    let quarterNum = Math.max(0, Math.floor(monthsSince / 3));

    const totalMonths = startMonth + quarterNum * 3;
    let pYear = startYear + Math.floor(totalMonths / 12);
    let pMonth = totalMonths % 12;
    let periodStart = new Date(pYear, pMonth, clampDay(pYear, pMonth, startDay));

    if (today < periodStart && quarterNum > 0) {
      quarterNum -= 1;
      const tm = startMonth + quarterNum * 3;
      pYear = startYear + Math.floor(tm / 12);
      pMonth = tm % 12;
      periodStart = new Date(pYear, pMonth, clampDay(pYear, pMonth, startDay));
    }

    // Next quarter start
    const nextTm = startMonth + (quarterNum + 1) * 3;
    const nYear = startYear + Math.floor(nextTm / 12);
    const nMonth = nextTm % 12;
    const nextStart = new Date(nYear, nMonth, clampDay(nYear, nMonth, startDay));
    const periodEnd = new Date(nextStart);
    periodEnd.setDate(periodEnd.getDate() - 1);

    return { periodStart, periodEnd };
  }

  if (periodType === 'yearly') {
    const startDay = budgetStart.getDate();
    const startMonth = budgetStart.getMonth();
    let yearOffset = today.getFullYear() - budgetStart.getFullYear();

    let periodStart = new Date(
      budgetStart.getFullYear() + yearOffset,
      startMonth,
      clampDay(budgetStart.getFullYear() + yearOffset, startMonth, startDay),
    );

    if (today < periodStart && yearOffset > 0) {
      yearOffset -= 1;
      periodStart = new Date(
        budgetStart.getFullYear() + yearOffset,
        startMonth,
        clampDay(budgetStart.getFullYear() + yearOffset, startMonth, startDay),
      );
    }

    const nextStart = new Date(
      budgetStart.getFullYear() + yearOffset + 1,
      startMonth,
      clampDay(budgetStart.getFullYear() + yearOffset + 1, startMonth, startDay),
    );
    const periodEnd = new Date(nextStart);
    periodEnd.setDate(periodEnd.getDate() - 1);

    return { periodStart, periodEnd };
  }

  // Fallback
  const end = endDateStr ? new Date(endDateStr) : today;
  return { periodStart: budgetStart, periodEnd: end };
}
