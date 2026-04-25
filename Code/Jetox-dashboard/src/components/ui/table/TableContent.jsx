import React, { Fragment } from "react";
import TruncatedText from "./TruncatedText";
import {
  getCellTextAlign,
  tableTdClasses,
  TABLE_CELL_BORDER,
} from "../../../utils/tableUi";

/**
 * TableContent Component
 * Renders the body of the table.
 * Supports custom cell rendering and optional row-level customization.
 */
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
  renderCustomRow,
}) => {
  return (
    <tbody>
      {data.map((row, rowIndex) => {
        if (renderCustomRow) {
          const customRow = renderCustomRow(row, rowIndex);
          if (customRow) return customRow;
        }

        return (
          <tr
            key={rowIndex}
            className={`group align-middle transition-colors duration-150 ${
              rowIndex % 2 === 0
                ? "bg-white dark:bg-slate-900"
                : "bg-slate-50/80 dark:bg-slate-800/35"
            } hover:bg-slate-50 dark:hover:bg-slate-800/70`}
          >
            {enableSelect && (
              <td
                className={`px-3 py-2.5 align-middle text-center w-12 ${TABLE_CELL_BORDER}`}
              >
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  checked={selectedRows.includes(rowIndex)}
                  onChange={() => toggleRowSelect(rowIndex)}
                />
              </td>
            )}

            {columns
              .filter((c) => {
                const k = typeof c === "string" ? c : c?.key;
                return k !== "Select";
              })
              .map((col, index) => {
                const colKey = typeof col === "string" ? col : col.key;

                if (colKey === "Actions" || colKey === "Action") {
                  const cell =
                    (renderAction && renderAction(row, rowIndex)) ||
                    (tableAction &&
                      tableAction(row, onView, onEdit, onDocument, rowIndex)) ||
                    null;
                  return (
                    <Fragment key={`act-${rowIndex}-${index}`}>
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

                if (renderRowCell) {
                  return (
                    <Fragment key={`cell-${rowIndex}-${colKey}-${index}`}>
                      {renderRowCell(colKey, value, row, rowIndex)}
                    </Fragment>
                  );
                }
                const align = getCellTextAlign(colKey);
                return (
                  <td key={index} className={tableTdClasses(colKey)}>
                    <TruncatedText
                      align={align}
                      className={
                        align === "right"
                          ? "tabular-nums text-gray-800 dark:text-slate-200"
                          : "text-gray-800 dark:text-slate-200"
                      }
                    >
                      {value}
                    </TruncatedText>
                  </td>
                );
              })}
          </tr>
        );
      })}
    </tbody>
  );
};

export default TableContent;
