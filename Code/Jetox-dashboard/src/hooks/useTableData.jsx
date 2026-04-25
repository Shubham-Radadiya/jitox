import { isValidElement } from "react";
import { IoEyeOutline } from "react-icons/io5";
import { TbEdit } from "react-icons/tb";
import { IoDocumentTextOutline } from "react-icons/io5";
import TruncatedText from "../components/ui/table/TruncatedText";
import {
  tableThClasses,
  tableTdClasses,
  paymentStatusBadgeClasses,
  orderStatusBadgeClasses,
  TABLE_ACTION_ICON_BTN,
  TABLE_ACTIONS_ROW,
  getCellTextAlign,
  STATUS_CELL_INNER,
  TABLE_CELL_BORDER,
} from "../utils/tableUi";

// Shared table helpers for status badges and default action cells
export const useTableData = () => {
  const tableRow = (value, columnKey = "") => {
    const align = getCellTextAlign(columnKey);
    return (
      <td className={tableTdClasses(columnKey)}>
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
  };

  const renderRowCell = (key, value) => {
    if (key === "Payment Status" || key === "Order Status" || key === "Status") {
      const badgeClass =
        key === "Order Status"
          ? orderStatusBadgeClasses(value)
          : paymentStatusBadgeClasses(value);
      return (
        <td className={tableTdClasses(key)}>
          <div className={STATUS_CELL_INNER}>
            <span className={badgeClass}>{value ?? "—"}</span>
          </div>
        </td>
      );
    }
    return tableRow(value, key);
  };

  /** @param {number} [_rowIndex] — reserved for list keys / debugging */
  const tableAction = (row, onView, onEdit, onDocument, _rowIndex) => {
    return (
      <td className={tableTdClasses("Actions")}>
        <div className={TABLE_ACTIONS_ROW}>
          <button
            type="button"
            title="View"
            className={TABLE_ACTION_ICON_BTN}
            onClick={(e) => {
              e.stopPropagation();
              onView?.(row);
            }}
          >
            <IoEyeOutline size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            title="Edit"
            className={TABLE_ACTION_ICON_BTN}
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(row);
            }}
          >
            <TbEdit size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            title="Document"
            className={TABLE_ACTION_ICON_BTN}
            onClick={(e) => {
              e.stopPropagation();
              onDocument?.(row);
            }}
          >
            <IoDocumentTextOutline size={18} />
          </button>
        </div>
      </td>
    );
  };

  /**
   * @param {string | import('react').ReactNode} labelOrNode
   * @param {string} [columnKey] — defaults to label when label is a string
   */
  const tableHeader = (labelOrNode, columnKey) => {
    if (isValidElement(labelOrNode)) {
      return (
        <th
          className={`min-w-0 px-3 py-2.5 text-center align-middle ${TABLE_CELL_BORDER} bg-slate-100 dark:bg-slate-800/90`}
        >
          {labelOrNode}
        </th>
      );
    }
    const key = columnKey ?? String(labelOrNode ?? "");
    return <th className={tableThClasses(key)}>{labelOrNode}</th>;
  };

  return {
    tableHeader,
    tableRow,
    renderRowCell,
    tableAction,
  };
};
