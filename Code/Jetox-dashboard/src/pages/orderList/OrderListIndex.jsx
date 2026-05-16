import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import DashboardLayout from "../../layouts/DashboardLayout";
import { SearchBar, CommonDropdown, DateRangePicker } from "../../components/ui/CommanUI";
import { TableContent } from "../../hooks/TableCustomHook";
import { LuArrowUpDown } from "react-icons/lu";
import { IoEyeOutline } from "react-icons/io5";
import { CreditCard, CalendarDays, FileText } from "lucide-react";
import { dashboardUiApi } from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../utils/apiError";
import TruncatedText from "../../components/ui/table/TruncatedText";
import OrdersTableShell from "../../components/ui/table/OrdersTableShell";
import {
  orderStatusBadgeClasses,
  paymentStatusBadgeClasses,
  orderTableThClasses,
  orderTableTdClasses,
  getCellTextAlign,
  STATUS_CELL_INNER_DENSE,
  TABLE_ACTION_ICON_BTN_DENSE,
  TABLE_ACTIONS_ROW_DENSE,
} from "../../utils/tableUi";
import OrderDetailsDrawer from "./OrderDetailsDrawer";
import InvoiceModal from "./InvoiceModal";
import {
  ORDER_SORT_OPTIONS,
  sortOrderRows,
} from "../../utils/orderListSort";

/** Matches Product Master summary cards (gradient panel + value pill). */
const ORDER_SUMMARY_METRIC_CARD = {
  tone:
    "from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-900/50 dark:to-teal-900/40 dark:text-emerald-200",
  cardTone:
    "from-white to-emerald-50/90 dark:from-slate-900 dark:to-emerald-950/30",
  borderTone: "border-emerald-200/80 dark:border-emerald-800/60",
};

function formatOrderSummaryMetricValue(label, raw, loading) {
  if (loading) return "…";
  if (raw == null || raw === "") return "—";
  if (typeof raw === "string" && raw.trim().startsWith("₹")) return raw;
  if (typeof raw === "number" && /amount|revenue/i.test(label)) {
    return `₹${Number(raw).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return String(raw);
}

const OrderListIndex = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [clientName, setClientName] = useState("all");
  const [manager, setManager] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detail, setDetail] = useState(null);
  const [orderDateRange, setOrderDateRange] = useState(null);
  const [orderSort, setOrderSort] = useState("newest");

  const columns = useMemo(
    () => [
      "Date",
      "Order ID",
      "Client Name",
      "Products",
      "Manager Name",
      "Paid",
      "Due",
      "Payment Status",
      "Total Amount",
      "Order Status",
      "Actions",
    ],
    []
  );

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard", "orders", "summary"],
    queryFn: async () => {
      const { data } = await dashboardUiApi.getOrdersSummary();
      return data;
    },
  });

  const ordersQueryKey = useMemo(
    () => [
      "dashboard",
      "orders",
      "list",
      activeTab,
      clientName,
      orderStatus,
      paymentStatus,
      manager,
      searchOrderId,
      orderDateRange?.[0] || "",
      orderDateRange?.[1] || "",
    ],
    [
      activeTab,
      clientName,
      orderStatus,
      paymentStatus,
      manager,
      searchOrderId,
      orderDateRange,
    ]
  );

  const {
    data: orders = [],
    isLoading: loading,
    isError: ordersError,
    error: ordersErrObj,
  } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      const { data } = await dashboardUiApi.getOrders({
        tab: activeTab,
        clientName: clientName === "all" ? "" : clientName,
        orderStatus,
        paymentStatus,
        managerName: manager,
        orderId: searchOrderId,
        dateFrom: orderDateRange?.[0] || "",
        dateTo: orderDateRange?.[1] || "",
      });
      return data.orders || [];
    },
  });

  useEffect(() => {
    if (ordersError && ordersErrObj) {
      toast.error(getApiErrorMessage(ordersErrObj, "Could not load orders"));
    }
  }, [ordersError, ordersErrObj]);

  const sortedOrders = useMemo(
    () => sortOrderRows(orders, orderSort),
    [orders, orderSort]
  );

  const payMutation = useMutation({
    mutationFn: (id) => dashboardUiApi.payOrder(id),
    onSuccess: () => {
      toast.success("Payment recorded");
      queryClient.invalidateQueries({ queryKey: ["dashboard", "orders"] });
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e, "Pay action failed"));
    },
  });

  const openDrawer = async (row) => {
    setSelectedRow(row);
    setDrawerOpen(true);
    setDetail(null);
    const id = row._id || row["Order ID"];
    try {
      const { data } = await dashboardUiApi.getOrder(id);
      setDetail(data.detail || null);
    } catch {
      setDetail(null);
    }
  };

  const handlePay = (row) => {
    const id = row._id || row["Order ID"];
    payMutation.mutate(id);
  };

  const renderRowCell = (key, value, row) => {
    if (key === "Date" && value && /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
      const formatted = dayjs(value).format("DD MMM YYYY");
      return (
        <td key={key} className={orderTableTdClasses(key)}>
          <TruncatedText className="tabular-nums text-gray-700 dark:text-slate-200" title={formatted}>
            {formatted}
          </TruncatedText>
        </td>
      );
    }
    if (key === "Payment Status") {
      return (
        <td key={key} className={orderTableTdClasses(key)}>
          <div className={STATUS_CELL_INNER_DENSE}>
            <span className={paymentStatusBadgeClasses(value, { dense: true })}>
              {value}
            </span>
          </div>
        </td>
      );
    }
    if (key === "Order Status") {
      return (
        <td key={key} className={orderTableTdClasses(key)}>
          <div className={STATUS_CELL_INNER_DENSE}>
            <span className={orderStatusBadgeClasses(value, { dense: true })}>
              {value}
            </span>
          </div>
        </td>
      );
    }
    if (key === "Products") {
      const text = value ?? "—";
      return (
        <td key={key} className={orderTableTdClasses(key)}>
          <TruncatedText
            ellipsis
            className="text-gray-800 dark:text-slate-200"
            title={String(text)}
          >
            {text}
          </TruncatedText>
        </td>
      );
    }
    const align = getCellTextAlign(key);
    return (
      <td key={key} className={orderTableTdClasses(key)}>
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

  const renderAction = (row) => (
    <td className={orderTableTdClasses("Actions")}>
      <div className={TABLE_ACTIONS_ROW_DENSE}>
        <button
          type="button"
          title="View order"
          className={TABLE_ACTION_ICON_BTN_DENSE}
          onClick={() => openDrawer(row)}
        >
          <IoEyeOutline size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Pay now"
          className={TABLE_ACTION_ICON_BTN_DENSE}
          disabled={String(row["Payment Status"]).toLowerCase() === "paid"}
          onClick={() => handlePay(row)}
        >
          <CreditCard size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Schedule"
          className={TABLE_ACTION_ICON_BTN_DENSE}
        >
          <CalendarDays size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Document / details"
          className={TABLE_ACTION_ICON_BTN_DENSE}
          onClick={() => openDrawer(row)}
        >
          <FileText size={14} strokeWidth={2} />
        </button>
      </div>
    </td>
  );

  const tabCounts = summary?.tabCounts || {
    all: 20,
    pending: 15,
    dispatched: 10,
    partSupply: 2,
    cancelled: 3,
  };

  const tabs = [
    { key: "all", label: "All Orders", count: tabCounts.all },
    { key: "pending", label: "Pending", count: tabCounts.pending },
    { key: "dispatched", label: "Dispatched", count: tabCounts.dispatched },
    { key: "part-supply", label: "Part Supply", count: tabCounts.partSupply },
    { key: "cancelled", label: "Cancelled", count: tabCounts.cancelled },
  ];

  const clientOptions = [
    { value: "all", label: "Client Name" },
    { value: "Mr. Ramesh Mehta", label: "Mr. Ramesh Mehta" },
    { value: "Alpha Traders", label: "Alpha Traders" },
    { value: "Bright Supplies", label: "Bright Supplies" },
    { value: "Green Agro", label: "Green Agro" },
  ];

  const orderStatusOptions = [
    { value: "all", label: "Order Status" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Processing", label: "Processing" },
    { value: "Dispatched", label: "Dispatched" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const paymentStatusOptions = [
    { value: "all", label: "Payment Status" },
    { value: "Paid", label: "Paid" },
    { value: "Unpaid", label: "Unpaid" },
    { value: "Pending", label: "Pending" },
  ];

  const tableHeader = (label) => (
    <th key={label} className={orderTableThClasses(label)}>
      {label}
    </th>
  );

  const invoiceData = detail?.invoice;

  return (
    <DashboardLayout>
      <div className="ds-stack-page min-w-0 max-w-full">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Total orders", raw: summary?.totalOrders },
            { label: "Returns", raw: summary?.orderReturns },
            { label: "Order amount", raw: summary?.totalOrderAmount },
            { label: "Revenue", raw: summary?.revenue },
            { label: "Dispatched", raw: summary?.orderDispatched },
          ].map((s) => (
            <div
              key={s.label}
              className={`group relative overflow-hidden rounded-xl border bg-gradient-to-r p-3 shadow-sm transition-shadow duration-200 hover:shadow-md ${ORDER_SUMMARY_METRIC_CARD.cardTone} ${ORDER_SUMMARY_METRIC_CARD.borderTone}`}
            >
              <div className="flex min-h-9 items-center justify-between gap-3">
                <span className="block min-w-0 flex-1 truncate text-left text-sm font-semibold leading-tight text-slate-700 dark:text-slate-200">
                  {s.label}
                </span>
                <div
                  className={`inline-flex min-w-10 max-w-[min(100%,11rem)] shrink-0 items-center justify-center rounded-md border border-white/70 bg-gradient-to-br px-3 py-1 text-sm font-bold tabular-nums shadow-sm dark:border-slate-700/70 ${ORDER_SUMMARY_METRIC_CARD.tone}`}
                >
                  <span className="truncate">
                    {formatOrderSummaryMetricValue(s.label, s.raw, summaryLoading)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="min-w-0 border-b border-gray-200 pb-1 dark:border-slate-700 max-md:-mx-1 max-md:overflow-x-auto max-md:overflow-y-hidden max-md:overscroll-x-contain max-md:px-1 max-md:[-webkit-overflow-scrolling:touch] max-md:touch-pan-x"
          role="tablist"
          aria-label="Order filters"
        >
          <div className="flex flex-nowrap items-center gap-2 md:flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap pb-2 px-0.5 text-xs transition rounded-t-md ${
                activeTab === t.key
                  ? "text-emerald-600 font-medium border-b-2 border-emerald-600 -mb-px dark:text-emerald-400"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {t.label}
              <span
                className={`text-[11px] leading-none px-1.5 py-0.5 rounded-full font-medium tabular-nums ${
                  activeTab === t.key
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                    : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <CommonDropdown
            filterBar
            hideAdd
            options={clientOptions}
            value={clientName}
            onChange={setClientName}
            placeholder="Client"
            className="min-w-0"
          />
          <CommonDropdown
            filterBar
            hideAdd
            options={orderStatusOptions}
            value={orderStatus}
            onChange={setOrderStatus}
            placeholder="Status"
            className="min-w-0"
          />
          <CommonDropdown
            filterBar
            hideAdd
            options={paymentStatusOptions}
            value={paymentStatus}
            onChange={setPaymentStatus}
            placeholder="Payment"
            className="min-w-0"
          />
          <SearchBar
            dense
            value={manager}
            onChange={setManager}
            placeholder="Manager search"
            className="w-full min-w-0"
          />
          <SearchBar
            dense
            value={searchOrderId}
            onChange={setSearchOrderId}
            placeholder="Order search"
            className="w-full min-w-0"
          />
          <div className="flex gap-2 items-end min-w-0">
            <DateRangePicker
              filterBar
              placeholder={["From", "To"]}
              className="flex-1 min-w-0"
              value={orderDateRange}
              onChange={setOrderDateRange}
            />
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
                aria-label="Sort"
              >
                <LuArrowUpDown size={16} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white shadow-md border border-gray-200 rounded-lg text-sm py-1 z-50 dark:bg-slate-900 dark:border-slate-600">
                  {ORDER_SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 dark:text-slate-200 dark:hover:bg-slate-800 ${
                        orderSort === opt.value
                          ? "bg-emerald-50 dark:bg-emerald-950/40"
                          : ""
                      }`}
                      onClick={() => {
                        setOrderSort(opt.value);
                        setSortOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <OrdersTableShell>
          <thead>
            <tr>{columns.map((col) => tableHeader(col))}</tr>
          </thead>
          <TableContent
            variant="ordersDense"
            columns={columns}
            data={loading ? [] : sortedOrders}
            renderRowCell={renderRowCell}
            renderAction={renderAction}
          />
        </OrdersTableShell>
        {!loading && sortedOrders.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-slate-500 border border-t-0 border-slate-200/90 rounded-b-lg bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            No orders found.
          </div>
        )}
        {loading && (
          <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">Loading orders…</div>
        )}
      </div>

      <OrderDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        row={selectedRow}
        detail={detail}
        invoice={invoiceData}
        onGenerateInvoice={() => {
          if (invoiceData) setInvoiceOpen(true);
          else toast.error("No invoice data for this order");
        }}
      />

      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        invoice={invoiceData}
      />
    </DashboardLayout>
  );
};

export default OrderListIndex;
