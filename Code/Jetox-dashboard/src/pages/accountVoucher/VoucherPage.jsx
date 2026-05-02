import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DashboardLayout from "../../layouts/DashboardLayout";
import { VoucherFilter, Button } from "../../components/ui/CommanUI";
import { voucherConfigs } from "./voucherConfig.jsx";
import { TableContent, tableColumnKey } from "../../hooks/TableCustomHook";
import { useTableData } from "../../hooks/useTableData";
import { useVoucherListData } from "../../hooks/useVoucherListData";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  TABLE_ELEMENT_CLASS,
  TABLE_WRAPPER_CLASS,
  tableThClasses,
  getTableCellAlignClass,
} from "../../utils/tableUi";
import ExcelColumnFilterHeader, {
  excelNormalizeCell,
} from "../../components/ui/table/ExcelColumnFilterHeader";
import { Plus, X } from "lucide-react";
import ManufacturingOverview from "./manufacturing/ManufacturingOverview";
import PurchaseVoucherModal from "./purchase/PurchaseVoucherModal";
import { purchaseReturnVouchersApi, purchaseVouchersApi } from "../../services/api";

const VoucherPage = () => {
  const { voucherSlug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const config = voucherConfigs[voucherSlug];
  const filterDefinitions = useMemo(() => config?.filterFields || [], [config]);

  const {
    tableHeader,
    renderRowCell: baseRenderRowCell,
    tableAction: defaultTableAction,
  } = useTableData();

  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [columnPickerPosition, setColumnPickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const columnPickerButtonRef = useRef(null);
  const columnPickerPopupRef = useRef(null);

  const baseColumns = useMemo(() => config?.columns || [], [config]);
  const [selectedColumns, setSelectedColumns] = useState(baseColumns);

  const showColumnPicker = Boolean(config?.enableColumnPicker);
  const visibleColumns = showColumnPicker ? selectedColumns : baseColumns;

  useEffect(() => {
    setSelectedColumns(baseColumns);
  }, [baseColumns]);

  useEffect(() => {
    if (!isColumnPickerOpen) return undefined;

    const handleClickOutside = (event) => {
      const clickedInsidePopup = columnPickerPopupRef.current?.contains(
        event.target
      );
      const clickedTrigger = columnPickerButtonRef.current?.contains(
        event.target
      );
      if (!clickedInsidePopup && !clickedTrigger) {
        setIsColumnPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isColumnPickerOpen]);

  const [activeModalKey, setActiveModalKey] = useState(null);

  useEffect(() => {
    setActiveModalKey(null);
  }, [voucherSlug]);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const [purchaseModal, setPurchaseModal] = useState({
    open: false,
    sourceRow: null,
    mode: "create",
  });
  const openPurchaseModal = useCallback((sourceRow, mode) => {
    setPurchaseModal({
      open: true,
      sourceRow:
        sourceRow && typeof sourceRow === "object" ? sourceRow : null,
      mode: mode || "create",
    });
  }, []);
  const closePurchaseModal = useCallback(() => {
    setPurchaseModal({ open: false, sourceRow: null, mode: "create" });
  }, []);

  const [excelFilters, setExcelFilters] = useState({});
  const [columnSort, setColumnSort] = useState(null);

  useEffect(() => {
    setExcelFilters({});
    setColumnSort(null);
  }, [voucherSlug]);

  const handleExcelApply = useCallback((colKey, keys) => {
    setExcelFilters((prev) => {
      const next = { ...prev };
      if (keys == null) {
        delete next[colKey];
      } else {
        next[colKey] = new Set(keys);
      }
      return next;
    });
  }, []);

  const handleColumnSort = useCallback((key, dir) => {
    if (dir == null) setColumnSort(null);
    else setColumnSort({ key, dir });
  }, []);

  const {
    data: apiRows = [],
    isLoading: rowsLoading,
    isError: rowsError,
    error: rowsErrorObj,
  } = useVoucherListData(voucherSlug);

  useEffect(() => {
    if (rowsError && rowsErrorObj) {
      toast.error(getApiErrorMessage(rowsErrorObj, "Could not load vouchers"));
    }
  }, [rowsError, rowsErrorObj]);

  const dataRows = useMemo(() => {
    if (!config) return [];
    if (config.rows != null && Array.isArray(config.rows)) return config.rows;
    return apiRows;
  }, [config, apiRows]);

  const displayedRows = useMemo(() => {
    let rows = [...dataRows];
    if (columnSort?.key) {
      const { key, dir } = columnSort;
      rows.sort((a, b) => {
        const va =
          excelNormalizeCell(a[key]) === "__BLANK__"
            ? ""
            : String(a[key] ?? "");
        const vb =
          excelNormalizeCell(b[key]) === "__BLANK__"
            ? ""
            : String(b[key] ?? "");
        const cmp = va.localeCompare(vb, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return dir === "asc" ? cmp : -cmp;
      });
    }
    visibleColumns.forEach((col) => {
      const k = tableColumnKey(col);
      if (!k || k === "Actions" || k === "Action") return;
      const sel = excelFilters[k];
      if (!sel) return;
      if (sel.size === 0) {
        rows = [];
        return;
      }
      rows = rows.filter((r) => sel.has(excelNormalizeCell(r[k])));
    });
    return rows;
  }, [dataRows, columnSort, excelFilters, visibleColumns]);

  const paymentSummary = useMemo(() => {
    if (voucherSlug === "payment" && config?.calculateSummary) {
      return config.calculateSummary(displayedRows);
    }
    return null;
  }, [voucherSlug, config, displayedRows]);

  if (!config) {
    return (
      <DashboardLayout>
        <div className="ds-stack-major">
          <VoucherFilter />
          <div className="rounded-lg border border-light-border bg-white p-4 text-sm text-light dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
            Unknown voucher type.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleToggleColumn = (column) => {
    if (column === "Actions") return;
    setSelectedColumns((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(column)) {
        nextSet.delete(column);
      } else {
        nextSet.add(column);
      }
      return baseColumns.filter((col) => nextSet.has(col));
    });
  };

  const toggleColumnPicker = () => {
    if (!isColumnPickerOpen && columnPickerButtonRef.current) {
      const rect = columnPickerButtonRef.current.getBoundingClientRect();
      setColumnPickerPosition({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
    setIsColumnPickerOpen((prev) => !prev);
  };

  const handleEdit =
    config.onEdit ||
    ((row) => {
      toast.success(
        `Edit for this row is not configured — use list actions (${row?.["Voucher No"] || row?.["Voucher No."] || ""}).`
      );
    });
  const handleDocument =
    config.onDocument ||
    ((row) => {
      toast.success(
        row?.["Voucher No"]
          ? `Documents for voucher ${row["Voucher No"]} — use Documents module.`
          : "Open Documents to attach files."
      );
    });

  const DetailsComponent = config.detailsComponent;

  const deletePurchaseVoucher = useCallback(
    async (id) => {
      if (!id) return;
      await purchaseVouchersApi.delete(String(id));
      await queryClient.invalidateQueries({ queryKey: ["voucher-list", "purchase"] });
    },
    [queryClient]
  );

  const deletePurchaseReturnVoucher = useCallback(
    async (id) => {
      if (!id) return;
      await purchaseReturnVouchersApi.delete(String(id));
      await queryClient.invalidateQueries({
        queryKey: ["voucher-list", "purchase-return"],
      });
    },
    [queryClient]
  );

  const openDetails = useCallback(
    async (row) => {
      if (!config) return;
      if (config.onView) {
        config.onView(row, {
          setSelectedDetails,
          setIsDetailsOpen,
          navigate,
        });
        return;
      }
      if (typeof config.fetchDetail === "function" && row?._id) {
        try {
          const detail = await config.fetchDetail(row._id);
          if (detail) {
            setSelectedDetails(detail);
            setIsDetailsOpen(true);
          }
        } catch (e) {
          toast.error(getApiErrorMessage(e, "Could not load details"));
        }
        return;
      }
      if (config.detailsMap && config.rowId) {
        const details = config.detailsMap[row[config.rowId]];
        if (details) {
          setSelectedDetails(details);
          setIsDetailsOpen(true);
        }
      }
    },
    [config, navigate]
  );

  const composedRenderRowCell = (key, value, row) => {
    if (config.renderRowCell) {
      return config.renderRowCell(
        key,
        value,
        (k, v) => baseRenderRowCell(k, v, row),
        row
      );
    }
    return baseRenderRowCell(key, value, row);
  };

  const tableAction =
    config.buildTableAction?.({
      navigate,
      openDetails,
      openPurchaseModal,
      deletePurchaseVoucher,
      deletePurchaseReturnVoucher,
    }) ||
    config.tableAction ||
    defaultTableAction;

  const filteredFooter = config.footerRenderer
    ? config.footerRenderer(visibleColumns, displayedRows)
    : null;

  const isManufacturingPage = voucherSlug === "manufacturing";

  const filterButtonFields = useMemo(
    () => filterDefinitions.filter((f) => f.type === "button"),
    [filterDefinitions]
  );

  const renderFilterField = (field) => {
    if (field.type === "button") {
      const handleClick = () => {
        if (field.action === "purchase-open") {
          openPurchaseModal(null, "create");
          return;
        }
        if (field.action === "navigate" && field.path) {
          navigate(field.path);
        } else if (field.action === "open-modal" && field.modalKey) {
          setActiveModalKey(field.modalKey);
        } else if (field.onClick) {
          field.onClick();
        }
      };
      return (
        <Button
          key={field.key}
          label={field.label}
          icon={field.icon}
          variant={field.variant || "primary"}
          size={field.size || "md"}
          className={field.className}
          onClick={handleClick}
        />
      );
    }

    return null;
  };

  const renderColumnHeader = (col) => {
    const key = tableColumnKey(col);
    if (key === "Actions" && showColumnPicker) {
      return (
        <React.Fragment key="actions-picker">
          {tableHeader(
            <div className="inline-flex">
              <button
                type="button"
                ref={columnPickerButtonRef}
                onClick={toggleColumnPicker}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-light-border bg-white shadow-sm hover:bg-gray-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <Plus
                  size={16}
                  className="text-slate-800 dark:text-emerald-400"
                  strokeWidth={2.25}
                />
              </button>
            </div>
          )}
        </React.Fragment>
      );
    }
    if (key === "Actions" || key === "Action") {
      return <React.Fragment key={key}>{tableHeader(col)}</React.Fragment>;
    }
    const label = typeof col === "string" ? col : col.label ?? col.key ?? key;
    const align = getTableCellAlignClass(key);
    const justify = align.includes("text-right")
      ? "justify-end"
      : align.includes("text-center")
        ? "justify-center"
        : "justify-between";
    const applied = excelFilters[key];
    const appliedArr =
      applied && applied.size > 0 ? Array.from(applied) : null;

    return (
      <th key={key} className={tableThClasses(key, { compact: true })}>
        <div className={`flex w-full min-w-0 items-center gap-1 ${justify}`}>
          <span className="min-w-0 truncate">{label}</span>
          <ExcelColumnFilterHeader
            columnKey={key}
            rows={dataRows}
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3 min-w-0 max-w-full">
        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/60 to-emerald-50/25 shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(16,185,129,0.04)] dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:items-center lg:justify-start lg:gap-2">
            <div className="flex w-full min-w-0 flex-row flex-wrap items-center gap-2.5 sm:gap-3 lg:max-w-[min(100%,28rem)] lg:shrink-0">
              <div className="flex min-w-0 flex-1 flex-row flex-wrap items-center gap-2.5 rounded-xl bg-white/80 p-2 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800/50 dark:ring-slate-600/50 sm:gap-3">
                <span className="flex shrink-0 items-center self-center whitespace-nowrap text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Voucher list
                </span>
                <div className="min-w-0 flex-1 basis-[min(100%,14rem)] sm:basis-auto">
                  <VoucherFilter className="max-w-none w-full" />
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-row flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-3 min-h-9 sm:border-t-0 sm:pt-0 lg:border-l lg:border-slate-200/80 lg:pl-3 dark:border-slate-600/80">
              <h2 className="m-0 min-w-0 flex-1 truncate text-xs font-bold uppercase leading-none tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {config.title}
              </h2>
              {filterButtonFields.length > 0 ? (
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {filterButtonFields.map((field) => renderFilterField(field))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {paymentSummary && (
          <div className="rounded-xl border border-light-border bg-white p-2.5 sm:p-3 dark:border-slate-600 dark:bg-slate-900">
            <div className="grid grid-cols-1 gap-3 text-center md:grid-cols-3">
              <div className="flex flex-col border-gray-200 md:border-r dark:border-slate-600">
                <div className="text-base font-bold text-dark sm:text-lg dark:text-slate-100">
                  {paymentSummary.totalAmount}
                </div>
                <div className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                  Total Amount Paid (₹)
                </div>
              </div>
              <div className="flex flex-col border-gray-200 md:border-r dark:border-slate-600">
                <div className="text-base font-semibold text-dark sm:text-lg dark:text-slate-100">
                  {paymentSummary.cashAmount}
                </div>
                <div className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                  Cash (₹)
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-base font-bold text-dark sm:text-lg dark:text-slate-100">
                  {paymentSummary.bankAmount}
                </div>
                <div className="text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                  Bank (₹)
                </div>
              </div>
            </div>
          </div>
        )}

        {isManufacturingPage && <ManufacturingOverview rows={displayedRows} />}

        {rowsLoading && !isManufacturingPage ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-light-border bg-white text-sm text-light dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
            Loading…
          </div>
        ) : !rowsLoading && dataRows.length === 0 && config.emptyState ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-light-border bg-white px-4 py-6 text-center sm:min-h-[240px] sm:px-6 dark:border-slate-600 dark:bg-slate-900">
            <p className="text-base font-semibold text-dark sm:text-lg dark:text-slate-100">
              {config.emptyState.title}
            </p>
            <p className="mt-2 max-w-md text-sm text-light dark:text-slate-400">
              {config.emptyState.description}
            </p>
          </div>
        ) : (
          <div className={TABLE_WRAPPER_CLASS}>
            <table className={TABLE_ELEMENT_CLASS}>
              <thead className="sticky top-0 z-[2] bg-gray-50 dark:bg-slate-900">
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  {visibleColumns.map((col) => renderColumnHeader(col))}
                </tr>
              </thead>

              <TableContent
                columns={visibleColumns}
                data={displayedRows}
                renderRowCell={composedRenderRowCell}
                tableAction={tableAction}
                onView={openDetails}
                onEdit={handleEdit}
                onDocument={handleDocument}
              />

              {filteredFooter}
            </table>
          </div>
        )}

        {isColumnPickerOpen && (
          <div className="fixed inset-0 right-6" style={{ zIndex: 999 }}>
          <div
            ref={columnPickerPopupRef}
            className="absolute w-56 -translate-x-1/2 overflow-hidden rounded-lg border border-light-border bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900 dark:shadow-xl dark:shadow-black/40"
            style={{
              top: columnPickerPosition.top,
              left: columnPickerPosition.left,
            }}
          >
            <div className="flex justify-between border-b border-light-border bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-800">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Add Column
              </div>
              <button
                type="button"
                onClick={() => setIsColumnPickerOpen(false)}
                className="rounded-md p-0.5 text-slate-600 transition hover:bg-slate-200/90 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex max-h-60 flex-col gap-2 overflow-y-auto p-3 dark:bg-slate-900">
              {baseColumns.map((column, colIdx) => {
                const colKey = tableColumnKey(column);
                const isChecked = selectedColumns.includes(column);
                const colLabel =
                  typeof column === "string"
                    ? column
                    : column?.label ?? column?.key ?? colKey;
                return (
                  <label
                    key={colKey ? `col-${colKey}` : `col-idx-${colIdx}`}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={colKey === "Actions" || colKey === "Action" ? true : isChecked}
                      disabled={colKey === "Actions" || colKey === "Action"}
                      onChange={() => handleToggleColumn(column)}
                      className="h-4 w-4 rounded border-slate-300 text-primary accent-primary focus:ring-primary/30 dark:border-slate-500 dark:bg-slate-900"
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-100">
                      {colLabel}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          </div>
        )}

        {DetailsComponent && (
          <DetailsComponent
            open={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            data={selectedDetails}
          />
        )}

        {config.modals?.map((modalConfig) => {
          const { key, component: ModalComponent, props } = modalConfig;
          return (
            <ModalComponent
              key={key}
              open={activeModalKey === key}
              onClose={() => setActiveModalKey(null)}
              {...(props || {})}
            />
          );
        })}

        {voucherSlug === "purchase" && (
          <PurchaseVoucherModal
            open={purchaseModal.open}
            onClose={closePurchaseModal}
            sourceRow={purchaseModal.sourceRow}
            mode={purchaseModal.mode}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default VoucherPage;
