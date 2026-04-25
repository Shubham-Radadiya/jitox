import { Plus } from "lucide-react";

/**
 * Shared toolbar "Add" actions: same height, padding, type scale, and Plus icon.
 * Use with `<Button label="Add …" {...mergePageAddButton()} onClick={…} />`.
 */

const SIZE_CLASS =
  "min-h-10 shrink-0 px-4 sm:px-5 text-[14px] leading-tight font-semibold";

const PRIMARY_EXTRA =
  "!text-white shadow-sm ring-1 ring-white/20 hover:brightness-110 active:brightness-95 dark:!text-white dark:ring-white/15 dark:hover:brightness-110";

const OUTLINE_EXTRA =
  "border-light-border text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800/80";

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
