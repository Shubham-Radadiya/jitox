/**
 * Single-line cell text. With `ellipsis`, overflows show "…" and full value on hover.
 * With `ellipsis={false}` (default), text stays on one line and the table can scroll horizontally.
 */
export default function TruncatedText({
  children,
  title,
  className = "",
  align = "left",
  ellipsis = false,
}) {
  const raw = children == null || children === "" ? "—" : children;
  const tip =
    title ??
    (ellipsis && (typeof raw === "string" || typeof raw === "number")
      ? String(raw)
      : undefined);

  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  const overflow = ellipsis
    ? "max-w-full truncate whitespace-nowrap"
    : "whitespace-nowrap";

  return (
    <span
      className={`block min-w-0 ${overflow} ${alignClass} ${className}`.trim()}
      title={tip}
    >
      {raw}
    </span>
  );
}
