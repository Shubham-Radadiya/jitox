import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTableData } from "../../../hooks/useTableData";
import { tableColumnKey } from "../../../hooks/TableCustomHook";
import TableContent from "./TableContent";
import {
  TABLE_ELEMENT_CLASS,
  TABLE_WRAPPER_CLASS,
  TABLE_CELL_BORDER,
  tableThClasses,
  getTableCellAlignClass,
} from "../../../utils/tableUi";
import ExcelColumnFilterHeader, {
  excelNormalizeCell,
} from "./ExcelColumnFilterHeader";

function buildDisplayedPipeline(data, columns, excelFilters, columnSort) {
  const list = Array.isArray(data) ? data : [];
  const keys = columns
    .map((c) => tableColumnKey(c))
    .filter((k) => k && k !== "Actions" && k !== "Action" && k !== "Select");

  let rows = list.map((row, originalIndex) => ({ row, originalIndex }));

  if (columnSort?.key) {
    const { key, dir } = columnSort;
    rows = [...rows].sort((a, b) => {
      const va =
        excelNormalizeCell(a.row[key]) === "__BLANK__"
          ? ""
          : String(a.row[key] ?? "");
      const vb =
        excelNormalizeCell(b.row[key]) === "__BLANK__"
          ? ""
          : String(b.row[key] ?? "");
      const cmp = va.localeCompare(vb, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return dir === "asc" ? cmp : -cmp;
    });
  }

  keys.forEach((k) => {
    const sel = excelFilters[k];
    if (!sel) return;
    if (sel.size === 0) {
      rows = [];
      return;
    }
    rows = rows.filter((item) => sel.has(excelNormalizeCell(item.row[k])));
  });

  return rows;
}

/**
 * DataTable — shared table with optional Excel-style column sort + value filters.
 */
const DataTable = ({
  columns,
  data,
  loading = false,
  enableSelect = false,
  selectedRows = [],
  toggleSelectAll,
  toggleRowSelect,
  onView,
  onEdit,
  onDocument,
  renderAction,
  renderCustomRow,
  renderRowCell: propsRenderRowCell,
  className = "",
  tableClassName = "",
  maxHeight = "none",
  renderFooter,
  /** When false, data is shown as-is (e.g. row selection tables). */
  enableExcelColumnFilters = !enableSelect,
  /** When true, Excel-style headers use left alignment and a leading layout (custom cells should add `!text-left` if they override `tableTdClasses`). */
  allCellsLeft = false,
}) => {
  const { tableHeader, renderRowCell: baseRenderRowCell, tableAction } =
    useTableData();
  const renderRowCell = propsRenderRowCell || baseRenderRowCell;
  const limitHeight = maxHeight && maxHeight !== "none";

  const [excelFilters, setExcelFilters] = useState({});
  const [columnSort, setColumnSort] = useState(null);

  const columnSig = useMemo(
    () =>
      (columns || [])
        .map((c) => tableColumnKey(c))
        .filter(Boolean)
        .join("|"),
    [columns]
  );

  useEffect(() => {
    setExcelFilters({});
    setColumnSort(null);
  }, [columnSig]);

  const handleExcelApply = useCallback((colKey, keys) => {
    setExcelFilters((prev) => {
      const next = { ...prev };
      if (keys == null) delete next[colKey];
      else next[colKey] = new Set(keys);
      return next;
    });
  }, []);

  const handleColumnSort = useCallback((key, dir) => {
    if (dir == null) setColumnSort(null);
    else setColumnSort({ key, dir });
  }, []);

  const pipeline = useMemo(() => {
    if (!enableExcelColumnFilters) {
      return (Array.isArray(data) ? data : []).map((row, originalIndex) => ({
        row,
        originalIndex,
      }));
    }
    return buildDisplayedPipeline(data, columns, excelFilters, columnSort);
  }, [
    data,
    columns,
    excelFilters,
    columnSort,
    enableExcelColumnFilters,
  ]);

  const displayedRows = useMemo(
    () => pipeline.map((p) => p.row),
    [pipeline]
  );

  const renderExcelHeader = (col) => {
    const key = tableColumnKey(col);
    const reactLabel =
      typeof col === "object" &&
      col != null &&
      col.label != null &&
      typeof col.label !== "string";

    if (reactLabel) {
      return (
        <React.Fragment key={`h-${key || "custom"}`}>
          {tableHeader(col.label, key)}
        </React.Fragment>
      );
    }

    if (!key || key === "Actions" || key === "Action" || key === "Select") {
      return (
        <React.Fragment key={`h-${key}`}>
          {typeof col === "string"
            ? tableHeader(col, col)
            : tableHeader(col.label, col.key)}
        </React.Fragment>
      );
    }

    const labelText =
      typeof col === "string" ? col : col.label ?? col.key ?? key;
    const align = getTableCellAlignClass(key);
    const justify = allCellsLeft
      ? "justify-start"
      : align.includes("text-right")
        ? "justify-end"
        : align.includes("text-center")
          ? "justify-center"
          : "justify-between";
    const applied = excelFilters[key];
    const appliedArr =
      applied && applied.size > 0 ? Array.from(applied) : null;
    const sourceRows = Array.isArray(data) ? data : [];

    return (
      <th
        key={key}
        className={
          allCellsLeft ? `${tableThClasses(key)} text-left!` : tableThClasses(key)
        }
      >
        <div className={`flex w-full min-w-0 items-center gap-2 ${justify}`}>
          <span className="min-w-0 truncate font-medium text-gray-700 dark:text-slate-200">
            {labelText}
          </span>
          <ExcelColumnFilterHeader
            columnKey={key}
            rows={sourceRows}
            appliedAllowed={appliedArr}
            onApplyAllowed={handleExcelApply}
            sortDir={columnSort?.key === key ? columnSort.dir : null}
            onSort={handleColumnSort}
            filterSort={
              typeof col === "object" && col != null ? col.filterSort : undefined
            }
          />
        </div>
      </th>
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">
        <div
          className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary rounded-full mb-2"
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
        <p>Loading data...</p>
      </div>
    );
  }

  const footerNode =
    typeof renderFooter === "function"
      ? renderFooter(displayedRows)
      : null;

  const rawLen = Array.isArray(data) ? data.length : 0;
  const showFilterEmpty =
    enableExcelColumnFilters &&
    rawLen > 0 &&
    displayedRows.length === 0;

  return (
    <div
      className={`${
        limitHeight
          ? "scrollbar-hide overflow-x-auto overflow-y-auto"
          : "overflow-x-auto"
      } ${TABLE_WRAPPER_CLASS} ${className}`}
      style={limitHeight ? { maxHeight } : undefined}
    >
      <table className={`${TABLE_ELEMENT_CLASS} ${tableClassName}`}>
        <thead className="sticky top-0 z-[2]">
          <tr>
            {enableSelect && (
              <th
                className={`px-2.5 py-2 text-center w-12 align-middle ${TABLE_CELL_BORDER} bg-slate-100 dark:bg-slate-800/90`}
              >
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  checked={
                    displayedRows.length > 0 &&
                    selectedRows.length === displayedRows.length
                  }
                  onChange={toggleSelectAll}
                />
              </th>
            )}

            {columns
              .filter((col) => tableColumnKey(col) !== "Select")
              .map((col, idx) => {
                const ck = tableColumnKey(col) || `col-${idx}`;
                if (enableExcelColumnFilters) return renderExcelHeader(col);
                return (
                  <Fragment key={ck}>
                    {typeof col === "string"
                      ? tableHeader(col, col)
                      : tableHeader(col.label, col.key)}
                  </Fragment>
                );
              })}
          </tr>
        </thead>

        <TableContent
          columns={columns}
          data={displayedRows}
          renderRowCell={renderRowCell}
          tableAction={tableAction}
          renderAction={renderAction}
          renderCustomRow={renderCustomRow}
          onView={onView}
          onEdit={onEdit}
          onDocument={onDocument}
          enableSelect={enableSelect}
          selectedRows={selectedRows}
          toggleRowSelect={toggleRowSelect}
        />
        {footerNode}
      </table>

      {showFilterEmpty && (
        <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
          No rows match the column filters. Clear filters from the column
          headers to see data again.
        </div>
      )}

      {!loading && rawLen === 0 && (
        <div className="p-4 text-center text-sm text-gray-500 bg-white dark:bg-slate-900 dark:text-slate-400">
          No records found.
        </div>
      )}
    </div>
  );
};

export default DataTable;
