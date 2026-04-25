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
          <div className="rounded-lg border border-light-border bg-white p-4 text-sm text-light">
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
                className="flex h-7 w-7 items-center justify-center rounded-full border border-light-border bg-white shadow-sm hover:bg-gray-50 hover:shadow-md"
              >
                <Plus size={16} className="text-dark" />
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
      <th key={key} className={tableThClasses(key)}>
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
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0 w-full sm:max-w-xs">
            <span className="text-xs font-medium text-light">Voucher List</span>
            <VoucherFilter />
          </div>
        </div>

        {paymentSummary && (
          <div className="bg-white border border-light-border rounded-xl p-2.5 sm:p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
              <div className="flex flex-col md:border-r border-gray-200">
                <div className="text-base sm:text-lg font-bold">
                  {paymentSummary.totalAmount}
                </div>
                <div className="text-xs sm:text-sm">Total Amount Paid (₹)</div>
              </div>
              <div className="flex flex-col md:border-r border-gray-200">
                <div className="text-base sm:text-lg font-semibold">
                  {paymentSummary.cashAmount}
                </div>
                <div className="text-xs sm:text-sm">Cash (₹)</div>
              </div>
              <div className="flex flex-col">
                <div className="text-base sm:text-lg font-bold">
                  {paymentSummary.bankAmount}
                </div>
                <div className="text-xs sm:text-sm">Bank (₹)</div>
              </div>
            </div>
          </div>
        )}

        {isManufacturingPage && <ManufacturingOverview rows={displayedRows} />}

        <div className="rounded-xl border border-light-border bg-white dark:bg-slate-900 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col gap-3 p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <h2 className="text-base sm:text-lg font-semibold text-dark tracking-tight shrink-0">
                {config.title}
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:justify-end min-w-0 flex-1">
                {filterButtonFields.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
                    {filterButtonFields.map((field) =>
                      renderFilterField(field)
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {rowsLoading && !isManufacturingPage ? (
          <div className="border border-light-border rounded-xl bg-white min-h-[200px] flex items-center justify-center text-light text-sm">
            Loading…
          </div>
        ) : !rowsLoading && dataRows.length === 0 && config.emptyState ? (
          <div className="border border-light-border rounded-xl bg-white min-h-[200px] sm:min-h-[240px] flex flex-col items-center justify-center px-4 py-6 sm:px-6 text-center">
            <p className="text-base sm:text-lg font-semibold text-dark">
              {config.emptyState.title}
            </p>
            <p className="text-sm text-light mt-2 max-w-md">
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
            className="absolute -translate-x-1/2 w-56 bg-white border border-light-border rounded-lg shadow-lg"
            style={{
              top: columnPickerPosition.top,
              left: columnPickerPosition.left,
            }}
          >
            <div className="flex justify-between border-b border-light-border bg-rowBg px-4 py-3 ">
              <div className="text-sm font-semibold text-dark">Add Column</div>
              <button
                onClick={() => setIsColumnPickerOpen(false)}
                className="text-dark hover:text-black transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-2 max-h-60 overflow-y-auto">
              {baseColumns.map((column) => {
                const isChecked = selectedColumns.includes(column);
                return (
                  <label
                    key={column}
                    className="flex items-center gap-3 px-1 py-1.5 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={column === "Actions" ? true : isChecked}
                      disabled={column === "Actions"}
                      onChange={() => handleToggleColumn(column)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-dark">{column}</span>
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
