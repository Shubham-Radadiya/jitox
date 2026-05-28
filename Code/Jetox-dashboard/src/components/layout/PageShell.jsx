import { createElement } from "react";

/**
 * Reusable page layout primitives — spacing follows 8px scale via Tailwind.
 * Prefer wrapping dashboard page roots with PageContainer when not using
 * DashboardLayout’s built-in max-width (e.g. modals, full-bleed subviews).
 */
export function PageContainer({ children, className = "" }) {
  return (
    <div className={`mx-auto w-full min-w-0 max-w-7xl ${className}`}>
      {children}
    </div>
  );
}

/** Major vertical blocks — aligns with `ds-stack-major` (16px rhythm). */
export function PageSection({ children, className = "", as = "section" }) {
  return createElement(as, { className: `ds-stack-major ${className}` }, children);
}

/** Responsive 12-column grid (1 col &lt; sm, 12 cols ≥ sm) */
export function ContentGrid({ children, className = "" }) {
  return <div className={`ds-grid-12 ${className}`}>{children}</div>;
}

const COL_SPAN = {
  12: "sm:col-span-12",
  9: "sm:col-span-9",
  8: "sm:col-span-8",
  6: "sm:col-span-6",
  4: "sm:col-span-4",
  3: "sm:col-span-3",
};

export function ContentGridSpan({ span = 12, children, className = "" }) {
  const colClass = COL_SPAN[span] ?? COL_SPAN[12];
  return (
    <div className={`min-w-0 ${colClass} ${className}`}>{children}</div>
  );
}
