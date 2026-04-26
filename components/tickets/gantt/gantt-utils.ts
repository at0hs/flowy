import type { Ticket } from "@/types";

export type GanttScale = "week" | "month" | "quarter";

export type ViewConfig = {
  dayWidth: number;
  rangeDays: number;
};

export function getViewConfig(scale: GanttScale): ViewConfig {
  switch (scale) {
    case "week":
      return { dayWidth: 40, rangeDays: 42 };
    case "month":
      return { dayWidth: 18, rangeDays: 120 };
    case "quarter":
      return { dayWidth: 6, rangeDays: 360 };
  }
}

export function getRangeStart(scale: GanttScale): Date {
  const { rangeDays } = getViewConfig(scale);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - Math.floor(rangeDays / 2));
  return start;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** "YYYY-MM-DD" → ローカルタイムのDateオブジェクト */
export function dateStringToDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** DateオブジェクトをISO日付文字列 "YYYY-MM-DD" に変換 */
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 日付文字列を指定日数シフトする */
export function shiftDateStr(dateStr: string, days: number): string {
  const date = dateStringToDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateString(date);
}

/** 日付文字列 → タイムライン上のx座標（px） */
export function dateToX(dateStr: string, rangeStart: Date, dayWidth: number): number {
  const date = dateStringToDate(dateStr);
  const diffMs = date.getTime() - rangeStart.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays * dayWidth;
}

/** ピクセル差分 → 日数（四捨五入） */
export function xToDays(deltaX: number, dayWidth: number): number {
  return Math.round(deltaX / dayWidth);
}

export type HeaderCell = {
  label: string;
  x: number;
  width: number;
  isWeekend?: boolean;
  isWeekStart?: boolean;
  isToday?: boolean;
};

export type HeaderRows = {
  upper: HeaderCell[];
  lower: HeaderCell[];
};

const MONTH_NAMES_FULL = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function getHeaderRows(
  scale: GanttScale,
  rangeStart: Date,
  rangeDays: number,
  dayWidth: number
): HeaderRows {
  const todayStr = formatDateString(new Date());

  if (scale === "week") {
    const upper: HeaderCell[] = [];
    const lower: HeaderCell[] = [];

    let currentMonth = -1;
    let monthStartI = 0;

    for (let i = 0; i < rangeDays; i++) {
      const date = addDays(rangeStart, i);
      const month = date.getMonth();
      const dow = date.getDay(); // 0=日, 6=土

      if (month !== currentMonth) {
        if (currentMonth !== -1) {
          upper.push({
            label: MONTH_NAMES_FULL[currentMonth],
            x: monthStartI * dayWidth,
            width: (i - monthStartI) * dayWidth,
          });
        }
        monthStartI = i;
        currentMonth = month;
      }

      lower.push({
        label: String(date.getDate()),
        x: i * dayWidth,
        width: dayWidth,
        isWeekend: dow === 0 || dow === 6,
        isWeekStart: dow === 0,
        isToday: formatDateString(date) === todayStr,
      });
    }
    // 最後の月セルを確定
    upper.push({
      label: MONTH_NAMES_FULL[currentMonth],
      x: monthStartI * dayWidth,
      width: (rangeDays - monthStartI) * dayWidth,
    });

    return { upper, lower };
  }

  if (scale === "month") {
    const upper: HeaderCell[] = [];

    let currentMonth = -1;
    let monthStartI = 0;

    for (let i = 0; i <= rangeDays; i++) {
      const date = addDays(rangeStart, i);
      const month = date.getMonth();

      if (month !== currentMonth || i === rangeDays) {
        if (currentMonth !== -1) {
          upper.push({
            label: MONTH_NAMES_FULL[currentMonth],
            x: monthStartI * dayWidth,
            width: (i - monthStartI) * dayWidth,
          });
        }
        monthStartI = i;
        currentMonth = month;
      }
    }

    // 下段: 週ブロック（日曜始まり、月が変わると週番号リセット）
    const lower: HeaderCell[] = [];
    let weekNum = 0;
    let weekCurrentMonth = -1;
    let weekStartI = -1;

    for (let i = 0; i <= rangeDays; i++) {
      if (i === rangeDays) {
        if (weekStartI !== -1) {
          lower.push({
            label: `${weekNum}w`,
            x: weekStartI * dayWidth,
            width: (i - weekStartI) * dayWidth,
          });
        }
        break;
      }

      const date = addDays(rangeStart, i);
      const month = date.getMonth();
      const dow = date.getDay();

      const monthChanged = month !== weekCurrentMonth;

      if (monthChanged || dow === 0) {
        if (weekStartI !== -1) {
          lower.push({
            label: `${weekNum}w`,
            x: weekStartI * dayWidth,
            width: (i - weekStartI) * dayWidth,
          });
        }
        if (monthChanged) {
          weekNum = 0;
          weekCurrentMonth = month;
        }
        weekNum++;
        weekStartI = i;
      }
    }

    return { upper, lower };
  }

  // quarter
  const upper: HeaderCell[] = [];
  const lower: HeaderCell[] = [];

  let currentQuarterKey = "";
  let quarterStartI = 0;
  let currentMonth = -1;
  let monthStartI = 0;

  for (let i = 0; i <= rangeDays; i++) {
    if (i === rangeDays) {
      if (currentQuarterKey) {
        upper.push({
          label: currentQuarterKey,
          x: quarterStartI * dayWidth,
          width: (i - quarterStartI) * dayWidth,
        });
      }
      if (currentMonth !== -1) {
        lower.push({
          label: MONTH_NAMES_FULL[currentMonth],
          x: monthStartI * dayWidth,
          width: (i - monthStartI) * dayWidth,
        });
      }
      break;
    }

    const date = addDays(rangeStart, i);
    const q = getQuarter(date);
    const year = date.getFullYear();
    const quarterKey = `${year} Q${q}`;
    const month = date.getMonth();

    if (quarterKey !== currentQuarterKey) {
      if (currentQuarterKey) {
        upper.push({
          label: currentQuarterKey,
          x: quarterStartI * dayWidth,
          width: (i - quarterStartI) * dayWidth,
        });
      }
      quarterStartI = i;
      currentQuarterKey = quarterKey;
    }

    if (month !== currentMonth) {
      if (currentMonth !== -1) {
        lower.push({
          label: MONTH_NAMES_FULL[currentMonth],
          x: monthStartI * dayWidth,
          width: (i - monthStartI) * dayWidth,
        });
      }
      monthStartI = i;
      currentMonth = month;
    }
  }

  return { upper, lower };
}

/** チケットを親子順に並べ替え、depth（0=親, 1=子）を付与する */
export function flattenTickets(tickets: Ticket[]): Array<Ticket & { depth: number }> {
  const rootTickets = tickets.filter((t) => !t.parent_id);
  const childrenMap = new Map<string, Ticket[]>();

  for (const ticket of tickets) {
    if (ticket.parent_id) {
      if (!childrenMap.has(ticket.parent_id)) {
        childrenMap.set(ticket.parent_id, []);
      }
      childrenMap.get(ticket.parent_id)!.push(ticket);
    }
  }

  const result: Array<Ticket & { depth: number }> = [];
  const seen = new Set<string>();

  for (const root of rootTickets) {
    result.push({ ...root, depth: 0 });
    seen.add(root.id);
    for (const child of childrenMap.get(root.id) ?? []) {
      result.push({ ...child, depth: 1 });
      seen.add(child.id);
    }
  }

  // parent_id が設定されているが親が表示されていない孤立チケット
  for (const ticket of tickets) {
    if (!seen.has(ticket.id)) {
      result.push({ ...ticket, depth: 0 });
    }
  }

  return result;
}
