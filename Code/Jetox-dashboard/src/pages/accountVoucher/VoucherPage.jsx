import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  purchaseRowHasParty,
  purchaseReturnRowHasParty,
  salesReturnRowHasParty,
  purchaseReturnRowPartyName,
} from "../../utils/purchasePaymentStatus";
import { invalidateProductAndStockQueries } from "../../utils/invalidateStockQueries";
import {
  hasOrderListDecisionMade,
} from "../../constants/orderStatus";
import {
  mapQuotationRow,
  resolveVoucherRowId,
} from "../../utils/voucherRowMappers";

function quotationDocPlain(saved) {
  if (!saved || typeof saved !== "object") return null;
  if (typeof saved.toObject === "function") return saved.toObject();
  return saved;
}
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
import ManufacturingFailedModal from "./manufacturing/ManufacturingFailedModal";
import ManufacturingFailedViewModal from "./manufacturing/ManufacturingFailedViewModal";
import { ManufacturingBlockedModal } from "./manufacturing/ManufacturingStockModals";
import PurchaseVoucherModal from "./purchase/PurchaseVoucherModal";
import PurchaseReturnModal from "./purchase/PurchaseReturnModal";
import SalesVoucherModal from "./purchase/SalesVoucherModal";
import SalesReturnModal from "./purchase/SalesReturnModal";
import SalesReturnRejectModal from "./modals/SalesReturnRejectModal";
import QuotationVoucherModal from "./purchase/QuotationVoucherModal";
import {
  expenseVouchersApi,
  paymentVouchersApi,
  purchaseReturnVouchersApi,
  purchaseVouchersApi,
  receiptVouchersApi,
  salesVouchersApi,
  salesReturnVouchersApi,
  manufacturingVouchersApi,
  quotationsApi,
} from "../../services/api";

/** Matches `w-56` (14rem); clamp math must stay in sync with popover max-width below */
const COLUMN_PICKER_MAX_WIDTH_PX = 224;

/** Mobile payment summary: label left + value pill (aligned with HRM SummaryCard pattern). */
const PAYMENT_SUMMARY_VALUE_PILL =
  "inline-flex min-h-8 min-w-10 max-w-[min(100%,10rem)] shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-gradient-to-br from-slate-100/90 to-slate-200/75 px-3 py-1 text-sm font-semibold tabular-nums text-slate-800 shadow-sm backdrop-blur-sm dark:border-slate-500/45 dark:from-slate-700/90 dark:to-slate-800/85 dark:text-slate-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

const VoucherPage = () => {
  const { voucherSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const computeColumnPickerPosition = useCallback(() => {
    const btn = columnPickerButtonRef.current;
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const margin = 12;
    const popoverW = Math.min(COLUMN_PICKER_MAX_WIDTH_PX, vw - 2 * margin);
    const half = popoverW / 2;
    const centerX = rect.left + rect.width / 2;
    const clampedLeft = Math.min(
      Math.max(centerX, half + margin),
      vw - half - margin
    );
    return { top: rect.bottom + 8, left: clampedLeft };
  }, []);

  useEffect(() => {
    if (!isColumnPickerOpen) return undefined;
    const update = () => {
      const next = computeColumnPickerPosition();
      if (next) setColumnPickerPosition(next);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isColumnPickerOpen, computeColumnPickerPosition]);

  const [activeModalKey, setActiveModalKey] = useState(null);
  // ExpenseModal is reused for both create and edit; this holds the raw doc
  // when the user clicks the pencil on a row.
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingJournal, setEditingJournal] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  /** Prefill amount/link when paying a purchase — Payment To chosen in modal. */
  const [paymentDraft, setPaymentDraft] = useState(null);
  const [receiptDraft, setReceiptDraft] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(null);

  useEffect(() => {
    setActiveModalKey(null);
    setEditingExpense(null);
    setEditingJournal(null);
    setEditingPayment(null);
    setPaymentDraft(null);
    setReceiptDraft(null);
    setEditingReceipt(null);
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

  const [purchaseReturnModal, setPurchaseReturnModal] = useState({
    open: false,
    sourceRow: null,
    mode: "create",
  });
  const openPurchaseReturnModal = useCallback((sourceRow, mode) => {
    setPurchaseReturnModal({
      open: true,
      sourceRow:
        sourceRow && typeof sourceRow === "object" ? sourceRow : null,
      mode: mode || "create",
    });
  }, []);
  const closePurchaseReturnModal = useCallback(() => {
    setPurchaseReturnModal({ open: false, sourceRow: null, mode: "create" });
  }, []);

  const [salesModal, setSalesModal] = useState({
    open: false,
    sourceRow: null,
    mode: "create",
  });
  const openSalesModal = useCallback((sourceRow, mode) => {
    setSalesModal({
      open: true,
      sourceRow:
        sourceRow && typeof sourceRow === "object" ? sourceRow : null,
      mode: mode || "create",
    });
  }, []);
  const closeSalesModal = useCallback(() => {
    setSalesModal({ open: false, sourceRow: null, mode: "create" });
  }, []);

  const [quotationModal, setQuotationModal] = useState({
    open: false,
    sourceRow: null,
    mode: "create",
  });
  const [quotationOrderBusyId, setQuotationOrderBusyId] = useState(null);
  const openQuotationModal = useCallback((sourceRow, mode) => {
    setQuotationModal({
      open: true,
      sourceRow:
        sourceRow && typeof sourceRow === "object" ? sourceRow : null,
      mode: mode || "create",
    });
  }, []);
  const closeQuotationModal = useCallback(() => {
    setQuotationModal({ open: false, sourceRow: null, mode: "create" });
  }, []);

  const [excelFilters, setExcelFilters] = useState({});
  const [columnSort, setColumnSort] = useState(null);

  useEffect(() => {
    setExcelFilters({});
    setColumnSort(null);
  }, [voucherSlug]);

  /** Open quotation modal from legacy `/add-quotation` redirect or `?editId=` on list URL. */
  useEffect(() => {
    if (voucherSlug !== "quotation") return;
    const state = location.state || {};
    const editIdFromQuery = String(searchParams.get("editId") || "").trim();
    const editIdFromState = String(state.openQuotationEditId || "").trim();

    if (state.openQuotationCreate) {
      openQuotationModal(null, "create");
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const editId = editIdFromState || editIdFromQuery;
    if (editId) {
      openQuotationModal({ _id: editId }, "edit");
      if (editIdFromQuery) {
        const next = new URLSearchParams(searchParams);
        next.delete("editId");
        setSearchParams(next, { replace: true });
      } else {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [
    voucherSlug,
    location.pathname,
    location.state,
    searchParams,
    navigate,
    setSearchParams,
    openQuotationModal,
  ]);

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
      const next = computeColumnPickerPosition();
      if (next) setColumnPickerPosition(next);
    }
    setIsColumnPickerOpen((prev) => !prev);
  };

  const handleEdit =
    config?.onEdit ||
    ((row) => {
      toast.success(
        `Edit for this row is not configured — use list actions (${row?.["Voucher No"] || row?.["Voucher No."] || ""}).`
      );
    });
  const handleDocument =
    config?.onDocument ||
    ((row) => {
      toast.success(
        row?.["Voucher No"]
          ? `Documents for voucher ${row["Voucher No"]} — use Documents module.`
          : "Open Documents to attach files."
      );
    });

  const DetailsComponent = config?.detailsComponent;

  const deletePurchaseVoucher = useCallback(
    async (id) => {
      if (!id) return;
      await purchaseVouchersApi.delete(String(id));
      await queryClient.invalidateQueries({ queryKey: ["voucher-list", "purchase"] });
    },
    [queryClient]
  );

  const deleteQuotationVoucher = useCallback(
    async (id) => {
      if (!id) return;
      await quotationsApi.delete(String(id));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["voucher-list", "quotation"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", "orders"] }),
      ]);
    },
    [queryClient]
  );

  const setQuotationAddedToOrder = useCallback(
    async (row, added) => {
      const id = resolveVoucherRowId(row);
      if (!id) {
        toast.error("Cannot update this row (missing id).");
        return;
      }
      if (hasOrderListDecisionMade(row._raw ?? row)) {
        toast.error("Order list choice was already set for this quotation.");
        return;
      }

      setQuotationOrderBusyId(id);
      queryClient.setQueryData(["voucher-list", "quotation"], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((r) => {
          if (String(r._id) !== String(id)) return r;
          const raw = {
            ...(r._raw && typeof r._raw === "object" ? r._raw : {}),
            addedToOrder: added,
            orderListDecisionMade: true,
            dashboardOrderStatus: "Pending",
            dashboardTab: "pending",
          };
          return mapQuotationRow(raw);
        });
      });

      try {
        const res = await quotationsApi.setAddedToOrder(id, added);
        const saved = quotationDocPlain(res?.data);
        if (saved) {
          queryClient.setQueryData(["voucher-list", "quotation"], (old) => {
            if (!Array.isArray(old)) return old;
            return old.map((r) => {
              if (String(r._id) !== String(id)) return r;
              return mapQuotationRow(saved);
            });
          });
        }
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["voucher-list", "quotation"],
          }),
          queryClient.invalidateQueries({ queryKey: ["dashboard", "orders"] }),
          queryClient.invalidateQueries({
            queryKey: ["quotation-voucher-detail", id],
          }),
        ]);
        toast.success(
          added
            ? "Quotation added to Order List (quotation kept)."
            : "Removed from Order List only (quotation kept)."
        );
      } catch (e) {
        await queryClient.invalidateQueries({
          queryKey: ["voucher-list", "quotation"],
        });
        toast.error(
          getApiErrorMessage(e, "Could not update order list status")
        );
      } finally {
        setQuotationOrderBusyId(null);
      }
    },
    [queryClient]
  );

  /**
   * Mark a payment voucher's status to "Paid" via PUT /paymentVouchers/update/:id.
   * If the payment is linked to a sales voucher (via `sourceSalesId`), the
   * backend reconciles that sale's `paidAmount` / `paymentStatus`, so we also
   * refresh the sales list here.
   */
  const markPaymentVoucherPaid = useCallback(
    async (id) => {
      if (!id) return;
      await paymentVouchersApi.update(String(id), { status: "Paid" });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["voucher-list", "payment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["voucher-list", "sales"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["voucher-list", "purchase"],
        }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["account-ledger"] }),
        queryClient.invalidateQueries({
          queryKey: ["voucher-list", "sales-return"],
        }),
      ]);
    },
    [queryClient]
  );

  const markReceiptVoucherPaid = useCallback(
    async (id) => {
      if (!id) return;
      await receiptVouchersApi.update(String(id), { status: "Paid" });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["voucher-list", "receipt"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["receiptVouchers"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["voucher-list", "sales"],
        }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
      ]);
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
      invalidateProductAndStockQueries(queryClient);
    },
    [queryClient]
  );

  const [salesReturnModal, setSalesReturnModal] = useState({
    open: false,
    sourceRow: null,
    mode: "create",
  });
  const openSalesReturnModal = useCallback((sourceRow, mode) => {
    setSalesReturnModal({
      open: true,
      sourceRow:
        sourceRow && typeof sourceRow === "object" ? sourceRow : null,
      mode: mode || "create",
    });
  }, []);
  const closeSalesReturnModal = useCallback(() => {
    setSalesReturnModal({ open: false, sourceRow: null, mode: "create" });
  }, []);

  const [salesReturnRejectModal, setSalesReturnRejectModal] = useState({
    open: false,
    sourceRow: null,
  });
  const openSalesReturnRejectModal = useCallback((sourceRow) => {
    setSalesReturnRejectModal({
      open: true,
      sourceRow: sourceRow && typeof sourceRow === "object" ? sourceRow : null,
    });
  }, []);
  const closeSalesReturnRejectModal = useCallback(() => {
    setSalesReturnRejectModal({ open: false, sourceRow: null });
  }, []);

  const deleteSalesReturnVoucher = useCallback(
    async (id) => {
      if (!id) return;
      await salesReturnVouchersApi.delete(String(id));
      await queryClient.invalidateQueries({
        queryKey: ["voucher-list", "sales-return"],
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "orders"] });
      invalidateProductAndStockQueries(queryClient);
    },
    [queryClient]
  );

  const approveSalesReturnVoucher = useCallback(
    (row) => {
      openSalesReturnModal(row, "approve");
    },
    [openSalesReturnModal]
  );

  const rejectSalesReturnVoucher = useCallback(
    (row) => {
      const id = row?._id;
      if (!id) {
        toast.error("Missing return id.");
        return;
      }
      openSalesReturnRejectModal(row);
    },
    [openSalesReturnRejectModal]
  );

  const deleteSalesVoucher = useCallback(
    async (id) => {
      if (!id) return;
      await salesVouchersApi.delete(String(id));
      await queryClient.invalidateQueries({
        queryKey: ["voucher-list", "sales"],
      });
      invalidateProductAndStockQueries(queryClient);
    },
    [queryClient]
  );

  /**
   * Sales-row "Send Payment Request" handler — directly creates a Payment
   * Voucher row from the sales voucher data and refreshes the Payment list.
   * Voucher number is generated server-side. The `paymentTo` is the customer
   * (party) name, amount defaults to the outstanding balance (or total if
   * nothing has been paid yet).
   */
  const createPaymentRequestForSale = useCallback(
    async (row) => {
      const raw = row?._raw || {};
      const partyName =
        raw.partyName || row?.["Party Name"] || row?.Party || "";
      if (!partyName) {
        toast.error("This sales row is missing a party name.");
        return;
      }

      const totalAmount = Number(raw.totalAmount) || 0;
      const paidAmount = Number(raw.paidAmount) || 0;
      const outstanding = Math.max(0, totalAmount - paidAmount);
      const amount = outstanding > 0 ? outstanding : totalAmount;
      if (!amount) {
        toast.error("Cannot send a payment request for ₹0.");
        return;
      }

      const invoiceNo = raw.voucherNo || row?.["Invoice No."] || "";
      const today = new Date().toISOString().slice(0, 10);

      /**
       * `paymentThrough` on Payment Voucher is restricted to "Cash" | "Bank".
       * The sales voucher's `paymentMode` is freeform ("Credit", "UPI", …),
       * so we normalise: "Cash" → "Cash", everything else → "Bank".
       */
      const paymentThrough =
        String(raw.paymentMode || "").trim().toLowerCase() === "cash"
          ? "Cash"
          : "Bank";

      try {
        await paymentVouchersApi.create({
          date: today,
          paymentTo: partyName,
          amount,
          paymentThrough,
          remarks: invoiceNo
            ? `Payment request for sales voucher ${invoiceNo}`
            : "Payment request from sales voucher",
          status: "Pending",
          sourceSalesId: raw._id,
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["voucher-list", "payment"],
          }),
          /**
           * Refresh the sales list too — the backend just linked the new
           * Payment Voucher's id onto this sale, so the row's button needs
           * to flip to disabled on the next render.
           */
          queryClient.invalidateQueries({
            queryKey: ["voucher-list", "sales"],
          }),
        ]);
        toast.success(
          invoiceNo
            ? `Payment request created for ${invoiceNo}.`
            : "Payment request created."
        );
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Could not create payment request"));
      }
    },
    [queryClient]
  );

  /**
   * Purchase-row credit card — opens Add Payment with amount/link prefilled.
   * User must pick Payment To manually; marking Paid updates the purchase.
   */
  const createPaymentRequestForPurchase = useCallback((row) => {
    const raw = row?._raw || {};
    if (!raw._id) {
      toast.error("This purchase row is missing an id — cannot create payment.");
      return;
    }
    if (!purchaseRowHasParty(row)) {
      toast.error(
        "Please select Party Name (supplier) on this purchase voucher using Edit, then create payment."
      );
      return;
    }

    const totalAmount = Number(raw.totalAmount) || 0;
    const paidAmount = Number(raw.paidAmount) || 0;
    const outstanding = Math.max(0, totalAmount - paidAmount);
    const amount = outstanding > 0 ? outstanding : totalAmount;
    if (!amount) {
      toast.error("Cannot create a payment voucher for ₹0.");
      return;
    }

    const voucherNo = raw.voucherNo || row?.["Voucher No."] || "";
    const today = new Date().toISOString().slice(0, 10);
    const paymentThrough =
      String(raw.paymentMode || "").trim().toLowerCase() === "cash"
        ? "Cash"
        : "Bank";

    setEditingPayment(null);
    setPaymentDraft({
      date: today,
      amount,
      paymentThrough,
      remarks: voucherNo
        ? `Payment for purchase voucher ${voucherNo}`
        : "Payment from purchase voucher",
      status: "Pending",
      sourcePurchaseId: raw._id,
    });
    setActiveModalKey("payment-modal");
  }, []);

  /**
   * Purchase-return row — opens Add Receipt (refund) with amount/party prefilled.
   */
  /** Sales row — opens Receipt Voucher (money received), linked to the sale. */
  const createReceiptForSale = useCallback((row) => {
    const raw = row?._raw || {};
    if (!raw._id) {
      toast.error("This sales row is missing an id — cannot create receipt.");
      return;
    }
    const paymentStatus = String(
      raw.paymentStatus || row?.["Payment Status"] || ""
    ).trim();
    const totalAmount = Number(raw.totalAmount) || 0;
    const paidAmount = Number(raw.paidAmount) || 0;
    if (
      paymentStatus === "Paid" ||
      (totalAmount > 0 && paidAmount >= totalAmount)
    ) {
      toast.error("This sales invoice is already fully paid.");
      return;
    }
    const partyName =
      raw.partyName || row?.["Party Name"] || row?.Party || "";
    if (!partyName) {
      toast.error("This sales row is missing a party name.");
      return;
    }

    const outstanding = Math.max(0, totalAmount - paidAmount);
    const amount = outstanding > 0 ? outstanding : totalAmount;
    if (!amount) {
      toast.error("Cannot create a receipt voucher for ₹0.");
      return;
    }

    const invoiceNo = raw.voucherNo || row?.["Invoice No."] || "";
    const today = new Date().toISOString().slice(0, 10);
    const paymentMode = String(raw.paymentMode || "").trim().toLowerCase();
    const receivedIn =
      paymentMode === "cash"
        ? "Cash"
        : paymentMode === "bank" || paymentMode === "online" || paymentMode === "cheque"
          ? "Bank"
          : "";

    setEditingReceipt(null);
    const quotationId = raw.sourceQuotationId
      ? String(raw.sourceQuotationId)
      : "";

    setReceiptDraft({
      date: today,
      amount,
      receivedIn,
      receiptFrom: partyName,
      remarks: invoiceNo
        ? `Receipt for sales voucher ${invoiceNo}`
        : "Receipt for sales voucher",
      status: "Paid",
      sourceSalesId: raw._id,
      ...(quotationId ? { sourceQuotationId: quotationId } : {}),
    });
    setActiveModalKey("receipt-modal");
  }, []);

  /**
   * Approved sales return — opens Payment Voucher (money out to customer).
   */
  const createRefundPaymentForSalesReturn = useCallback((row) => {
    const raw = row?._raw || {};
    const rowId = raw._id ?? row?._id;
    if (!rowId) {
      toast.error(
        "This sales return row is missing an id — cannot create payment."
      );
      return;
    }
    if (
      String(
        raw.approvalStatus ||
          row?.["Refund Order Status"] ||
          row?.Status ||
          ""
      ) !== "Approved"
    ) {
      toast.error("Approve the sales return before recording a refund.");
      return;
    }
    if (!salesReturnRowHasParty(row)) {
      toast.error(
        "Please set client name on this sales return, then create refund payment."
      );
      return;
    }
    const total = Number(raw.totalAmount) || 0;
    const refunded = Number(raw.refundedAmount) || 0;
    const amount = Math.max(0, total - refunded);
    if (!amount) {
      toast.error("This return is already fully refunded.");
      return;
    }
    const voucherNo = raw.voucherNo || row?.["Return ID"] || "";
    const today = new Date().toISOString().slice(0, 10);
    const party =
      raw.partyName || row?.["Client Name"] || row?.Party || "";
    setEditingPayment(null);
    setPaymentDraft({
      date: today,
      amount,
      paymentTo: party,
      paymentFrom: "",
      remarks: voucherNo
        ? `Refund for sales return ${voucherNo}`
        : "Refund for sales return",
      status: "Paid",
      sourceSalesReturnId: String(rowId),
    });
    setActiveModalKey("payment-modal");
  }, []);

  const createRefundReceiptForPurchaseReturn = useCallback((row) => {
    const raw = row?._raw || {};
    if (!raw._id) {
      toast.error(
        "This purchase return row is missing an id — cannot create receipt."
      );
      return;
    }
    if (!purchaseReturnRowHasParty(row)) {
      toast.error(
        "Please set Party Name on this purchase return, then create refund receipt."
      );
      return;
    }
    const amount = Number(raw.totalAmount) || 0;
    if (!amount) {
      toast.error("Cannot create a receipt for ₹0.");
      return;
    }
    const voucherNo = raw.voucherNo || row?.["Voucher No."] || "";
    const today = new Date().toISOString().slice(0, 10);
    setEditingReceipt(null);
    setReceiptDraft({
      date: today,
      amount,
      receivedIn: "",
      receiptFrom: purchaseReturnRowPartyName(row),
      remarks: voucherNo
        ? `Refund for purchase return ${voucherNo}`
        : "Refund for purchase return",
      status: "Paid",
      sourcePurchaseReturnId: raw._id,
    });
    setActiveModalKey("receipt-modal");
  }, []);

  const closeReceiptModal = useCallback(() => {
    setActiveModalKey(null);
    setReceiptDraft(null);
    setEditingReceipt(null);
  }, []);

  /** Open receipt modal to complete a Pending receipt (bank/cash + Received). */
  const openReceiptRecordReceived = useCallback((row) => {
    const raw = row?._raw;
    if (!raw?._id) {
      toast.error("This receipt row is missing an id — cannot update.");
      return;
    }
    const statusLabel = String(row?.Status || "").trim();
    if (statusLabel === "Received") {
      toast.error("This receipt is already marked as Received.");
      return;
    }
    setReceiptDraft(null);
    setEditingReceipt(raw);
    setActiveModalKey("receipt-modal");
  }, []);

  const openReceiptEdit = useCallback((row) => {
    const raw = row?._raw;
    if (!raw?._id) {
      toast.error("This receipt is missing an id — cannot edit.");
      return;
    }
    setReceiptDraft(null);
    setEditingReceipt(raw);
    setActiveModalKey("receipt-modal");
  }, []);

  // ---- Expense voucher: edit + quick-attach proof --------------------------
  // `editingExpense` is declared up near `activeModalKey` so both reset
  // together when the slug changes. Setting it alongside the modal key in
  // the open handler keeps the open state and the edit data in lockstep.
  const openExpenseEdit = useCallback((row) => {
    const raw = row?._raw;
    if (!raw?._id) {
      toast.error("This expense is missing an id — cannot edit.");
      return;
    }
    setEditingExpense(raw);
    setActiveModalKey("expense-modal");
  }, []);

  const closeExpenseModal = useCallback(() => {
    setActiveModalKey(null);
    setEditingExpense(null);
  }, []);

  const closeJournalModal = useCallback(() => {
    setActiveModalKey(null);
    setEditingJournal(null);
  }, []);

  const openPaymentEdit = useCallback((row) => {
    const raw = row?._raw;
    if (!raw?._id) {
      toast.error("This payment row is missing an id — cannot edit.");
      return;
    }
    setPaymentDraft(null);
    setEditingPayment(raw);
    setActiveModalKey("payment-modal");
  }, []);

  const closePaymentModal = useCallback(() => {
    setActiveModalKey(null);
    setEditingPayment(null);
    setPaymentDraft(null);
  }, []);

  const openJournalEdit = useCallback((row) => {
    const raw = row?._raw;
    if (!raw?._id) {
      toast.error("This journal row is missing an id — cannot edit.");
      return;
    }
    setEditingJournal(raw);
    setActiveModalKey("journal-modal");
  }, []);

  const handleJournalSaved = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["voucher-list", "journal"],
    });
    void queryClient.invalidateQueries({
      queryKey: ["journal-next-voucher-no"],
    });
    void queryClient.invalidateQueries({ queryKey: ["accounts"] });
  }, [queryClient]);

  /** Opens a one-off file picker, validates, and PUTs only the new proof file
   *  to /expenseVouchers/update/:id. Mirrors the validation done inside
   *  ExpenseModal so the paperclip shortcut feels consistent. */
  const attachExpenseProof = useCallback(
    (row) => {
      const id = row?._raw?._id;
      if (!id) {
        toast.error("This expense is missing an id — cannot attach a file.");
        return;
      }
      const input = document.createElement("input");
      input.type = "file";
      input.accept =
        ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const allowed = /\.(jpe?g|png|webp|pdf)$/i.test(file.name);
        if (!allowed) {
          toast.error("Only JPG, JPEG, PNG, WEBP, or PDF files are allowed.");
          return;
        }
        if (file.size > 20 * 1024 * 1024) {
          toast.error("Proof file must be 20 MB or smaller.");
          return;
        }
        try {
          const body = new FormData();
          body.append("uploadProof", file);
          await expenseVouchersApi.update(String(id), body);
          await queryClient.invalidateQueries({
            queryKey: ["voucher-list", "expenses"],
          });
          toast.success("Proof attached.");
        } catch (e) {
          toast.error(getApiErrorMessage(e, "Could not attach proof"));
        }
      };
      input.click();
    },
    [queryClient]
  );

  const invalidateManufacturingList = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["voucher-list", "manufacturing"],
    });
    invalidateProductAndStockQueries(queryClient);
  }, [queryClient]);

  const [mfgFailFormRow, setMfgFailFormRow] = useState(null);
  const [mfgFailViewRow, setMfgFailViewRow] = useState(null);
  const [mfgBlocked, setMfgBlocked] = useState({
    open: false,
    row: null,
    issues: [],
  });
  const [mfgRechecking, setMfgRechecking] = useState(false);

  const openFailManufacturingForm = useCallback((row) => {
    setMfgFailFormRow(row);
  }, []);

  const openMfgBlockedModal = useCallback(async (row) => {
    let issues = Array.isArray(row?.stockIssues)
      ? row.stockIssues
      : Array.isArray(row?._raw?.stockIssues)
        ? row._raw.stockIssues
        : [];
    const id = String(row?._raw?._id ?? row?._id ?? "").trim();
    if (!issues.length && id) {
      try {
        const { data } = await manufacturingVouchersApi.recheckStock(id);
        if (!data?.ok && Array.isArray(data?.stockIssues)) {
          issues = data.stockIssues;
        }
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Could not load stock details"));
        return;
      }
    }
    if (!issues.length) {
      toast.error("No raw material shortage found for this batch.");
      return;
    }
    setMfgBlocked({ open: true, row, issues });
  }, []);

  const closeMfgBlockedModal = useCallback(() => {
    setMfgBlocked({ open: false, row: null, issues: [] });
  }, []);

  const recheckMfgBlockedStock = useCallback(async () => {
    const id = String(mfgBlocked.row?._raw?._id ?? mfgBlocked.row?._id ?? "").trim();
    if (!id) {
      toast.error("Batch id missing — close and open this batch again.");
      return;
    }
    setMfgRechecking(true);
    try {
      invalidateProductAndStockQueries(queryClient);
      await queryClient.refetchQueries({ queryKey: ["products"] });

      const { data } = await manufacturingVouchersApi.recheckStock(id);
      const issues = data?.stockIssues || [];
      if (data?.ok) {
        toast.success("Stock is sufficient now. You can start manufacturing.");
        closeMfgBlockedModal();
        invalidateManufacturingList();
      } else {
        setMfgBlocked((prev) => ({ ...prev, issues }));
        toast.error("Some raw materials are still low on stock.");
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not recheck stock"));
    } finally {
      setMfgRechecking(false);
    }
  }, [
    mfgBlocked.row,
    closeMfgBlockedModal,
    invalidateManufacturingList,
    queryClient,
  ]);

  const startManufacturingBatch = useCallback(
    async (row) => {
      const id = row?._id;
      if (!id) {
        toast.error("Batch id missing.");
        return;
      }
      if (row?.stockBlocked) {
        openMfgBlockedModal(row);
        return;
      }
      try {
        await manufacturingVouchersApi.start(id);
        toast.success("Manufacturing started. Raw stock updated.");
        invalidateManufacturingList();
      } catch (e) {
        const body = e?.response?.data;
        const issues = Array.isArray(body?.stockIssues) ? body.stockIssues : [];
        if (issues.length) {
          openMfgBlockedModal({ ...row, stockIssues: issues, stockBlocked: true });
        } else {
          toast.error(getApiErrorMessage(e, "Could not start batch"));
        }
      }
    },
    [invalidateManufacturingList, openMfgBlockedModal]
  );

  const completeManufacturingBatch = useCallback(
    async (row) => {
      const id = row?._id;
      if (!id) {
        toast.error("Batch id missing.");
        return;
      }
      try {
        await manufacturingVouchersApi.complete(id);
        toast.success("Batch completed. Finished product added to stock.");
        invalidateManufacturingList();
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Could not complete batch"));
      }
    },
    [invalidateManufacturingList]
  );

  const deleteManufacturingBatch = useCallback(
    async (row) => {
      const id = row?._id;
      if (!id) return;
      if (!window.confirm("Delete this planned manufacturing batch?")) return;
      try {
        await manufacturingVouchersApi.delete(id);
        toast.success("Batch deleted.");
        invalidateManufacturingList();
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Could not delete batch"));
      }
    },
    [invalidateManufacturingList]
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
      if (typeof config.fetchDetail === "function") {
        const rowId = resolveVoucherRowId(row);
        if (!rowId) {
          toast.error("Cannot view this row (missing record id).");
          return;
        }
        try {
          const detail = await config.fetchDetail(rowId);
          if (detail) {
            setSelectedDetails(detail);
            setIsDetailsOpen(true);
          } else {
            toast.error("Could not load details for this record.");
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

  const openDetailsForTable = useCallback(
    (row) => {
      if (
        voucherSlug === "manufacturing" &&
        String(row?.Status ?? "") === "Failed"
      ) {
        setMfgFailViewRow(row);
        return;
      }
      openDetails(row);
    },
    [voucherSlug, openDetails]
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
    config?.buildTableAction?.({
      navigate,
      openDetails: openDetailsForTable,
      openPurchaseModal,
      openPurchaseReturnModal,
      openSalesReturnModal,
      openSalesModal,
      deletePurchaseVoucher,
      createPaymentRequestForPurchase,
      openQuotationModal,
      deleteQuotationVoucher,
      setQuotationAddedToOrder,
      quotationOrderBusyId,
      deletePurchaseReturnVoucher,
      deleteSalesReturnVoucher,
      approveSalesReturnVoucher,
      rejectSalesReturnVoucher,
      createRefundReceiptForPurchaseReturn,
      createRefundPaymentForSalesReturn,
      deleteSalesVoucher,
      createPaymentRequestForSale,
      createReceiptForSale,
      markPaymentVoucherPaid,
      markReceiptVoucherPaid,
      openReceiptEdit,
      openReceiptRecordReceived,
      openExpenseEdit,
      openPaymentEdit,
      attachExpenseProof,
      openJournalEdit,
      onVoucherDocument: handleDocument,
      startManufacturingBatch,
      completeManufacturingBatch,
      deleteManufacturingBatch,
      openFailManufacturingForm,
      openMfgBlockedModal,
    }) ||
    config?.tableAction ||
    defaultTableAction;

  const filteredFooter = config?.footerRenderer
    ? config.footerRenderer(visibleColumns, displayedRows)
    : null;

  const isManufacturingPage = voucherSlug === "manufacturing";

  const filterButtonFields = useMemo(
    () => filterDefinitions.filter((f) => f.type === "button"),
    [filterDefinitions]
  );

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

  const renderFilterField = (field) => {
    if (field.type === "button") {
      const handleClick = () => {
        if (field.action === "purchase-open") {
          openPurchaseModal(null, "create");
          return;
        }
        if (field.action === "purchase-return-open") {
          openPurchaseReturnModal(null, "create");
          return;
        }
        if (field.action === "sales-return-open") {
          openSalesReturnModal(null, "create");
          return;
        }
        if (field.action === "sales-open") {
          openSalesModal(null, "create");
          return;
        }
        if (field.action === "quotation-open") {
          openQuotationModal(null, "create");
          return;
        }
        if (field.action === "navigate" && field.path) {
          navigate(field.path);
        } else if (field.action === "open-modal" && field.modalKey) {
          if (field.modalKey === "journal-modal") {
            setEditingJournal(null);
          }
          if (field.modalKey === "payment-modal") {
            setEditingPayment(null);
            setPaymentDraft(null);
          }
          if (field.modalKey === "expense-modal") {
            setEditingExpense(null);
          }
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
        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/60 to-emerald-50/25 shadow-[0_1px_3px_rgba(15,23,42,0.07),0_4px_12px_rgba(16,185,129,0.04)] dark:border-slate-600/80 dark:bg-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/95 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
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
          <div className="relative overflow-hidden rounded-xl border border-slate-200/55 bg-gradient-to-br from-white/80 via-slate-50/45 to-slate-100/30 p-3 shadow-sm backdrop-blur-md dark:border-slate-500/45 dark:from-slate-900/80 dark:via-slate-800/55 dark:to-slate-900/45 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] sm:p-3.5">
            {/* Mobile & tablet &lt; md: same row layout as HRM “Total employees” summary card */}
            <ul className="flex min-w-0 flex-col divide-y divide-slate-200/70 dark:divide-slate-600/70 md:hidden !mb-0">
              <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <span className="min-w-0 flex-1 text-left text-sm font-semibold leading-tight text-slate-700 dark:text-slate-200">
                  Total Amount Paid (₹)
                </span>
                <div className={`${PAYMENT_SUMMARY_VALUE_PILL} truncate font-bold`}>
                  {paymentSummary.totalAmount}
                </div>
              </li>
              <li className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0 flex-1 text-left text-sm font-semibold leading-tight text-slate-700 dark:text-slate-200">
                  Cash (₹)
                </span>
                <div className={`${PAYMENT_SUMMARY_VALUE_PILL} truncate`}>
                  {paymentSummary.cashAmount}
                </div>
              </li>
              <li className="flex items-center justify-between gap-3 pb-0 pt-3 last:pb-0">
                <span className="min-w-0 flex-1 text-left text-sm font-semibold leading-tight text-slate-700 dark:text-slate-200">
                  Bank (₹)
                </span>
                <div className={`${PAYMENT_SUMMARY_VALUE_PILL} truncate font-bold`}>
                  {paymentSummary.bankAmount}
                </div>
              </li>
            </ul>

            <div className="hidden grid-cols-1 gap-3 text-center md:grid md:grid-cols-3">
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

        {isManufacturingPage && <ManufacturingOverview rows={dataRows} />}

        {rowsLoading ? (
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
          <div className="fixed inset-0 z-[999]">
            <div
              ref={columnPickerPopupRef}
              className="absolute w-[min(14rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 overflow-hidden rounded-lg border border-light-border bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900 dark:shadow-xl dark:shadow-black/40"
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
          const isExpense = key === "expense-modal";
          const isJournal = key === "journal-modal";
          const isPayment = key === "payment-modal";
          const isReceipt = key === "receipt-modal";
          return (
            <ModalComponent
              key={key}
              open={activeModalKey === key}
              onClose={
                isExpense
                  ? closeExpenseModal
                  : isJournal
                    ? closeJournalModal
                    : isPayment
                      ? closePaymentModal
                      : isReceipt
                        ? closeReceiptModal
                        : () => setActiveModalKey(null)
              }
              {...(isExpense ? { expense: editingExpense } : {})}
              {...(isJournal
                ? {
                    journal: editingJournal,
                    onSaved: handleJournalSaved,
                  }
                : {})}
              {...(isPayment
                ? { payment: editingPayment, draft: paymentDraft }
                : {})}
              {...(isReceipt
                ? { receipt: editingReceipt, draft: receiptDraft }
                : {})}
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

        {voucherSlug === "purchase-return" && (
          <PurchaseReturnModal
            open={purchaseReturnModal.open}
            onClose={closePurchaseReturnModal}
            sourceRow={purchaseReturnModal.sourceRow}
            mode={purchaseReturnModal.mode}
          />
        )}

        {voucherSlug === "sales" && (
          <SalesVoucherModal
            open={salesModal.open}
            onClose={closeSalesModal}
            sourceRow={salesModal.sourceRow}
            mode={salesModal.mode}
          />
        )}

        {voucherSlug === "sales-return" && (
          <>
            <SalesReturnModal
              open={salesReturnModal.open}
              onClose={closeSalesReturnModal}
              sourceRow={salesReturnModal.sourceRow}
              mode={salesReturnModal.mode}
            />
            <SalesReturnRejectModal
              open={salesReturnRejectModal.open}
              onClose={closeSalesReturnRejectModal}
              sourceRow={salesReturnRejectModal.sourceRow}
              onRejected={async () => {
                await queryClient.invalidateQueries({
                  queryKey: ["voucher-list", "sales-return"],
                });
                await queryClient.invalidateQueries({
                  queryKey: ["dashboard", "orders"],
                });
              }}
            />
          </>
        )}

        {voucherSlug === "quotation" && (
          <QuotationVoucherModal
            open={quotationModal.open}
            onClose={closeQuotationModal}
            sourceRow={quotationModal.sourceRow}
            mode={quotationModal.mode}
          />
        )}

        {isManufacturingPage && (
          <>
            <ManufacturingFailedModal
              open={Boolean(mfgFailFormRow)}
              row={mfgFailFormRow}
              onClose={() => setMfgFailFormRow(null)}
              onSaved={invalidateManufacturingList}
            />
            <ManufacturingFailedViewModal
              open={Boolean(mfgFailViewRow)}
              row={mfgFailViewRow}
              onClose={() => setMfgFailViewRow(null)}
            />
            <ManufacturingBlockedModal
              open={mfgBlocked.open}
              onClose={closeMfgBlockedModal}
              issues={mfgBlocked.issues}
              onRecheck={recheckMfgBlockedStock}
              rechecking={mfgRechecking}
              onEdit={() => {
                const rawStatus = String(
                  mfgBlocked.row?._raw?.status ?? ""
                ).trim();
                if (
                  rawStatus !== "Planned" &&
                  rawStatus !== "Paused"
                ) {
                  toast.error(
                    "This batch is already in progress — reduce materials via Fail or add stock in Product Master."
                  );
                  return;
                }
                const batchId = String(
                  mfgBlocked.row?._raw?._id ?? mfgBlocked.row?._id ?? ""
                ).trim();
                closeMfgBlockedModal();
                if (batchId) {
                  navigate(
                    `/dashboard/accounting-voucher/add-manufacturing?batchId=${encodeURIComponent(batchId)}`
                  );
                } else {
                  navigate("/dashboard/accounting-voucher/add-manufacturing");
                }
              }}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VoucherPage;
