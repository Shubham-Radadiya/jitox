import React from "react";

/**
 * One row: left slot (My Data toggle or "Filter By") + right-aligned filter controls.
 */
const SummaryFilterBar = ({
  leading = null,
  showFilterLabel = false,
  children,
  className = "",
}) => {
  const hasLeft = Boolean(leading) || showFilterLabel;

  return (
    <div
      className={`flex w-full min-w-0 flex-wrap items-center gap-y-2 gap-x-3 sm:flex-nowrap sm:items-center ${
        hasLeft ? "sm:justify-between" : "sm:justify-end"
      } ${className}`.trim()}
    >
      {leading}
      {showFilterLabel && !leading && (
        <p className="shrink-0 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Filter By
        </p>
      )}
      {children ? (
        <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto sm:flex-nowrap sm:gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default SummaryFilterBar;
