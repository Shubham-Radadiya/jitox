import { Plus } from "lucide-react";

/**
 * Shared toolbar "Add" actions: same height, padding, type scale, and Plus icon.
 * Use with `<Button label="Add …" {...mergePageAddButton()} onClick={…} />`.
 */

const SIZE_CLASS =
  "min-h-10 shrink-0 px-4 sm:px-5 text-[14px] leading-tight font-semibold";

const PRIMARY_EXTRA =
  "!text-white shadow-sm ring-1 ring-white/20 hover:brightness-110 active:brightness-95 dark:!text-white dark:ring-white/15 dark:hover:brightness-110";

/**
 * Do not set `hover:bg-*` / `hover:text-*` here — Tailwind layer order can let them beat `Button`
 * `outline`’s `hover:bg-primary hover:!text-white`, which produced **white label on pale grey**.
 * Only tweak default (non-hover) colors; hover stays the shared outline = green fill + white text.
 */
const OUTLINE_EXTRA =
  "text-slate-800 dark:border-slate-600 dark:text-slate-100";

/**
 * Primary green Add (list / master toolbars).
 * @param {Record<string, unknown>} [overrides] — e.g. `{ className: "ml-1" }` merged into className
 */
export function mergePageAddButton(overrides = {}) {
  const className = [SIZE_CLASS, PRIMARY_EXTRA, overrides.className]
    .filter(Boolean)
    .join(" ");
  return {
    variant: "primary",
    size: "md",
    icon: Plus,
    ...overrides,
    className,
  };
}

/**
 * Outlined Add (secondary: new row, quick customer, etc.) — same size as primary.
 */
export function mergePageAddOutlineButton(overrides = {}) {
  const className = [SIZE_CLASS, OUTLINE_EXTRA, overrides.className]
    .filter(Boolean)
    .join(" ");
  return {
    variant: "outline",
    size: "md",
    icon: Plus,
    ...overrides,
    className,
  };
}
