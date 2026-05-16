import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

/** Matches API / form values such as "13 May, 2026" or "01 July, 2025". */
const DATE_FORMATS = [
  "DD MMM, YYYY",
  "DD MMMM, YYYY",
  "DD MMM YYYY",
  "DD MMMM YYYY",
];

function parseSchemeDate(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  for (const fmt of DATE_FORMATS) {
    const d = dayjs(s, fmt, true);
    if (d.isValid()) return d.startOf("day");
  }
  const loose = dayjs(s);
  return loose.isValid() ? loose.startOf("day") : null;
}

/**
 * @param {Record<string, unknown>} row — scheme list row with "Start Date" / "End Date"
 * @returns {"Active" | "Expired" | "Upcoming" | "—"}
 */
export function getSchemeLifecycleStatus(row) {
  const start = parseSchemeDate(row?.["Start Date"]);
  const end = parseSchemeDate(row?.["End Date"]);
  const today = dayjs().startOf("day");

  if (!start && !end) return "—";

  if (start && end) {
    if (today.isBefore(start)) return "Upcoming";
    if (today.isAfter(end)) return "Expired";
    return "Active";
  }

  if (start && !end) {
    if (today.isBefore(start)) return "Upcoming";
    return "Active";
  }

  if (!start && end) {
    if (today.isAfter(end)) return "Expired";
    return "Active";
  }

  return "—";
}
