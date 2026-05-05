import { Fragment } from "react";
import { tableTdClasses, TABLE_CELL_BORDER } from "../utils/tableUi";

/** Normalize column def: string or `{ key, label, filterSort?: 'text'|'date'|'amount' }` (Excel filter popover). */
export function tableColumnKey(col) {
  if (col == null) return "";
  if (typeof col === "string") return col;
  if (typeof col === "object" && col.key != null) return String(col.key);
  return "";
}

export const TableContent = ({
  columns,
  data,
  renderRowCell,
  renderAction,
  tableAction,
  onView,
  onEdit,
  onDocument,
  selectedRows = [],
  toggleRowSelect,
  enableSelect = false,
  /** `ordersDense`: tighter zebra + hover for financial order grids */
  variant = "default",
}) => {
  return (
    <tbody>
      {data.map((row, rowIndex) => (
        <tr
          key={rowIndex}
          className={
            variant === "ordersDense"
              ? `group align-middle transition-colors duration-150 ${
                  rowIndex % 2 === 0
                    ? "bg-white dark:bg-slate-900"
                    : "bg-slate-50/90 dark:bg-slate-800/40"
                } hover:bg-slate-50 dark:hover:bg-slate-800/70`
              : `group align-middle transition-colors duration-150 ${
                  rowIndex % 2 === 0
                    ? "bg-white dark:bg-slate-900"
                    : "bg-slate-50/80 dark:bg-slate-800/40"
                } hover:bg-slate-50 dark:hover:bg-slate-800/70`
          }
        >
          {enableSelect && (
            <td
              className={`px-2.5 py-2 align-middle text-center w-12 ${TABLE_CELL_BORDER}`}
            >
              <input
                type="checkbox"
                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer dark:border-slate-500 dark:bg-slate-800"
                checked={selectedRows.includes(rowIndex)}
                onChange={() => toggleRowSelect(rowIndex)}
              />
            </td>
          )}

          {columns
            .filter((c) => tableColumnKey(c) !== "Select")
            .map((col, colIndex) => {
              const colKey = tableColumnKey(col);
              if (colKey === "Actions" || colKey === "Action") {
                const cell =
                  (renderAction && renderAction(row, rowIndex)) ||
                  (tableAction &&
                    tableAction(row, onView, onEdit, onDocument, rowIndex)) ||
                  null;
                return (
                  <Fragment key={`act-${rowIndex}-${colIndex}`}>
                    {cell ?? (
                      <td
                        className={`${tableTdClasses("Actions")} text-gray-400 dark:text-slate-500`}
                      >
                        —
                      </td>
                    )}
                  </Fragment>
                );
              }

              const value = row[colKey];
              return (
                <Fragment key={`cell-${rowIndex}-${colKey}-${colIndex}`}>
                  {renderRowCell(colKey, value, row, rowIndex)}
                </Fragment>
              );
            })}
        </tr>
      ))}
    </tbody>
  );
};
