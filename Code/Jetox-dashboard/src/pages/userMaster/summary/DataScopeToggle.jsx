import React from "react";

/**
 * My Data vs team users toggle on user summary tabs.
 * @param {"my" | "team"} value
 * @param {number} teamCount
 */
const DataScopeToggle = ({ value, onChange, teamCount = 0 }) => {
  const teamLabel = `User (${teamCount})`;

  return (
    <div
      className="inline-flex w-fit max-w-full flex-nowrap items-center gap-0.5 rounded-lg bg-slate-100/90 p-0.5 whitespace-nowrap dark:bg-slate-800/80"
      role="group"
      aria-label="Data scope"
    >
      <button
        type="button"
        onClick={() => onChange("my")}
        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors sm:rounded-lg sm:px-4 sm:py-1 sm:text-[13px] ${
          value === "my"
            ? "bg-white text-primary shadow-sm ring-1 ring-primary/15 dark:bg-slate-900 dark:ring-primary/25"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
        }`}
        aria-pressed={value === "my"}
      >
        My Data
      </button>
      <button
        type="button"
        onClick={() => onChange("team")}
        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors sm:rounded-lg sm:px-4 sm:py-1 sm:text-[13px] ${
          value === "team"
            ? "bg-white text-primary shadow-sm ring-1 ring-primary/15 dark:bg-slate-900 dark:ring-primary/25"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
        }`}
        aria-pressed={value === "team"}
      >
        {teamLabel}
      </button>
    </div>
  );
};

export default DataScopeToggle;
