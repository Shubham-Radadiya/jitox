import { useMemo, useState, useEffect, useId } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IoEyeOutline } from "react-icons/io5";
import { CalendarDays, Receipt, ScrollText } from "lucide-react";
import {
  Info,
  PackagePlus,
  Store,
  PackageX,
  PackageOpen,
  BanknoteArrowUp,
  BanknoteArrowDown,
  TrendingDown,
  TrendingUp,
  Coins,
  FileClock,
  HandCoins,
  Warehouse,
  Truck,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { DashboardStatCard } from "../../components/dashboard/DashboardStatCard";
import { CustomerSummaryCard } from "../../components/dashboard/CustomerSummaryCard";
import OrderDetailsDrawer from "../orderList/OrderDetailsDrawer";
import SalesVoucherModal from "../accountVoucher/purchase/SalesVoucherModal";
import ReceiptModal from "../accountVoucher/modals/ReceiptModal";
import TruncatedText from "../../components/ui/table/TruncatedText";
import OrdersTableShell from "../../components/ui/table/OrdersTableShell";
import { SearchBar, DateRangePicker } from "../../components/ui/CommanUI";
import { TableContent } from "../../hooks/TableCustomHook";
import { LuArrowUpDown, LuLayoutGrid, LuList } from "react-icons/lu";
import { dashboardUiApi, quotationsApi } from "../../services/api";
import { parseRupeeCell, salesDocToOrderDetailShape } from "../../utils/voucherRowMappers";
import { getApiErrorMessage } from "../../utils/apiError";
import { isManagerUser } from "../../utils/authSession";
import {
  orderTableThClasses,
  orderTableTdClasses,
  getCellTextAlign,
  TABLE_ACTION_ICON_BTN_DENSE,
  TABLE_ACTIONS_ROW_DENSE,
} from "../../utils/tableUi";
import toast from "react-hot-toast";

/** Semantic UI variant per metric (drives soft tint + icon well). */
const STAT_CARD_DEFS = [
  { key: "purchase", label: "PURCHASE", variant: "neutral" },
  { key: "sales", label: "SALES", variant: "positive" },
  { key: "purchaseReturn", label: "PURCHASE RETURN", variant: "negative" },
  { key: "salesReturn", label: "SALES RETURN", variant: "negative" },
  { key: "payments", label: "PAYMENTS", variant: "warning" },
  { key: "receipt", label: "RECEIPT", variant: "positive" },
  { key: "expense", label: "EXPENSE", variant: "negative" },
  { key: "cashBank", label: "CASH / BANK BALANCE", variant: "neutral" },
  { key: "payable", label: "PAYABLE", variant: "neutral" },
  { key: "receivable", label: "RECEIVABLE", variant: "neutral" },
  { key: "stock", label: "STOCK", variant: "neutral" },
  { key: "order", label: "ORDER", variant: "neutralInk" },
];

/** Optional subtle trend glyph (income-style vs outflow-style). */
const STAT_TREND_BY_KEY = {
  sales: "up",
  receipt: "up",
  purchaseReturn: "down",
  salesReturn: "down",
  expense: "down",
  payments: "down",
};

const STAT_ICONS = {
  purchase: PackagePlus,
  sales: Store,
  purchaseReturn: PackageX,
  salesReturn: PackageOpen,
  payments: BanknoteArrowUp,
  receipt: BanknoteArrowDown,
  expense: TrendingDown,
  cashBank: Coins,
  payable: FileClock,
  receivable: HandCoins,
  stock: Warehouse,
  order: Truck,
};

const KPI_ROUTES = {
  purchase: "/dashboard/accounting-voucher/purchase",
  sales: "/dashboard/accounting-voucher/sales",
  purchaseReturn: "/dashboard/accounting-voucher/purchase-return",
  salesReturn: "/dashboard/accounting-voucher/sales-return",
  payments: "/dashboard/accounting-voucher/payment",
  receipt: "/dashboard/accounting-voucher/receipt",
  expense: "/dashboard/accounting-voucher/expenses",
  cashBank: "/dashboard/daybook",
  payable: "/dashboard/payable",
  receivable: "/dashboard/receivable",
  stock: "/dashboard/stock",
  order: "/dashboard/order-list",
  orders: "/dashboard/order-list",
  payables: "/dashboard/payable",
  salesToday: "/dashboard/reports",
};

const KPI_INFO = {
  purchase: "Purchase vouchers and inward stock.",
  sales: "Sales invoices and outward billing.",
  purchaseReturn: "Purchase return vouchers.",
  salesReturn: "Sales return vouchers.",
  payments: "Payment vouchers to parties.",
  receipt: "Receipt vouchers from customers.",
  expense: "Expense vouchers.",
  cashBank: "Day book — cash and bank movement.",
  payable: "Total payment vouchers (Payable summary).",
  receivable: "Total receipt vouchers (Receivable summary).",
  stock: "Inventory and stock levels.",
  order: "Order list and dispatch.",
  orders: "Opens order list & dispatch — track all customer orders.",
  payables: "Supplier and expense payables summary.",
  salesToday: "Reports & analytics for revenue trends.",
};

function mergeStatKpis(apiKpis) {
  const map = new Map((apiKpis || []).map((k) => [k.key, k]));
  return STAT_CARD_DEFS.map((def) => {
    const fromApi = map.get(def.key);
    const dir = fromApi?.trend?.direction ?? STAT_TREND_BY_KEY[def.key];
    return {
      key: def.key,
      label: fromApi?.label || def.label,
      variant: def.variant,
      value: fromApi?.value ?? "Rs : 0",
      trend: dir ? { direction: dir } : undefined,
    };
  });
}

function PeriodToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-light-border bg-rowBg p-1 text-xs dark:border-slate-600 dark:bg-slate-800/80">
      {["Month", "Week"].map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p.toLowerCase())}
          className={`px-4 py-2 rounded-md transition cursor-pointer ${
            value === p.toLowerCase()
              ? "bg-white text-dark shadow-sm font-medium dark:bg-slate-700 dark:text-slate-100 dark:shadow-md"
              : "text-light hover:text-dark dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function DonutRing({ pct, color, size = 88, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function donutSlicePath(cx, cy, innerR, outerR, startDeg, endDeg) {
  const sweep = endDeg - startDeg;
  if (sweep >= 359.99) {
    return [
      `M ${cx} ${cy - outerR}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx - 0.001} ${cy - outerR}`,
      `M ${cx} ${cy - innerR}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx + 0.001} ${cy - innerR}`,
      "Z",
    ].join(" ");
  }
  const start = ((startDeg - 90) * Math.PI) / 180;
  const end = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + outerR * Math.cos(start);
  const y1 = cy + outerR * Math.sin(start);
  const x2 = cx + outerR * Math.cos(end);
  const y2 = cy + outerR * Math.sin(end);
  const x3 = cx + innerR * Math.cos(end);
  const y3 = cy + innerR * Math.sin(end);
  const x4 = cx + innerR * Math.cos(start);
  const y4 = cy + innerR * Math.sin(start);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

/** Multi-segment donut — hover a segment to preview its share (Managers / Dealers / Users). */
function SegmentedDonutRing({
  segments,
  hoveredLabel = null,
  onSegmentEnter,
  onSegmentLeave,
  size = 92,
  stroke = 11,
}) {
  const pad = 4;
  const cx = size / 2;
  const cy = size / 2;
  const midR = (size - stroke) / 2;
  const innerR = midR - stroke / 2;
  const outerR = midR + stroke / 2;
  const valid = (segments || []).filter((s) => Number(s.pct) > 0);
  const totalPct = valid.reduce((sum, s) => sum + Number(s.pct), 0) || 1;

  let startAngle = 0;
  const slices = valid.map((seg, index) => {
    const isLast = index === valid.length - 1;
    const sweep = isLast
      ? 360 - startAngle
      : (Number(seg.pct) / totalPct) * 360;
    const endAngle = startAngle + sweep;
    const slice = {
      ...seg,
      startAngle,
      endAngle,
      path: donutSlicePath(cx, cy, innerR, outerR, startAngle, endAngle),
    };
    startAngle = endAngle;
    return slice;
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
      className="shrink-0 overflow-visible"
      role="img"
      aria-label="User distribution chart"
      onMouseLeave={onSegmentLeave}
    >
      <path
        d={donutSlicePath(cx, cy, innerR, outerR, 0, 360)}
        fill="#e5e7eb"
        className="dark:fill-slate-600"
      />
      {slices.map((seg) => {
        const isHovered = hoveredLabel === seg.label;
        const dimmed = hoveredLabel && !isHovered;
        return (
          <path
            key={seg.label}
            d={seg.path}
            fill={seg.color}
            className={`cursor-default transition-opacity duration-150 ${
              dimmed ? "opacity-35" : "opacity-100"
            }`}
            onMouseEnter={() => onSegmentEnter?.(seg.label)}
          />
        );
      })}
    </svg>
  );
}

/** Small area + line chart for Total Revenue card (sparkline). */
function RevenueSparkline({ series }) {
  const gradId = useId().replace(/:/g, "");
  const data =
    Array.isArray(series) && series.length > 1
      ? series
      : [42, 48, 44, 52, 49, 58, 55, 62, 60, 68, 65, 72];
  const n = data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1e-6, max - min);
  const w = 100;
  const h = 56;
  const padX = 4;
  const padY = 6;
  const innerW = w - 2 * padX;
  const innerH = h - 2 * padY;
  const points = data.map((v, i) => {
    const x = padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = padY + innerH - ((v - min) / range) * innerH;
    return [x, y];
  });
  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
    .join(" ");
  const areaD = `${lineD} L ${points[points.length - 1][0].toFixed(2)} ${h} L ${points[0][0].toFixed(2)} ${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-[88px] max-w-[200px] text-sky-500 sm:h-[120px]"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`revSparkFill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(14 165 233)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(14 165 233)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#revSparkFill-${gradId})`} />
      <path
        d={lineD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Grouped column chart: golden receivables, blue payables (dashboard reference). */
function StackedBars({ months, a, b, labels }) {
  const max = Math.max(1, ...a, ...b);
  const barH = 140;
  return (
    <div className="flex items-end justify-between gap-0.5 sm:gap-1 pt-2 pb-1 min-h-[168px]">
      {months.map((m, i) => (
        <div
          key={m}
          className="flex-1 flex flex-col items-center gap-2 min-w-0 max-w-full"
        >
          <div
            className="flex gap-0.5 sm:gap-1 items-end w-full justify-center"
            style={{ height: barH }}
          >
            <div
              className="w-[38%] max-w-[14px] rounded-t-md bg-[#EAB308] shadow-sm"
              style={{
                height: `${Math.max(0, (a[i] / max) * 100)}%`,
                minHeight: a[i] ? 6 : 0,
              }}
              title={`${labels[0]} ${a[i]}`}
            />
            <div
              className="w-[38%] max-w-[14px] rounded-t-md bg-[#2563EB] shadow-sm"
              style={{
                height: `${Math.max(0, (b[i] / max) * 100)}%`,
                minHeight: b[i] ? 6 : 0,
              }}
              title={`${labels[1]} ${b[i]}`}
            />
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate w-full text-center">
            {m}
          </span>
        </div>
      ))}
    </div>
  );
}

const defaultOverview = {
  kpis: STAT_CARD_DEFS.map((d) => ({
    key: d.key,
    label: d.label,
    value: "Rs : 0",
  })),
  customers: {
    totalPct: 0,
    segments: [],
    dailyGrowthPct: 0,
    weeklyGrowthPct: 0,
  },
  receivablesPayables: { months: [], receivables: [], payables: [] },
  recentOrders: [],
  salesTarget: {
    targetAmount: 50000000,
    achievedAmount: 0,
    targetLabel: "Sales Target",
    secondaryTarget: 100000,
    secondaryAchieved: 0,
    secondaryLabel: "Total Achieve",
    revenueTrendPct: 0,
    txnTrendPct: 0,
    totalRevenueAmount: 0,
    revenueTrendLabel: "From last week",
    revenueSparkline: [],
  },
  actions: [],
  stockItems: [],
  attendance: { present: 0, absent: 0, lateIn: 0, earlyOut: 0 },
  userDistribution: { total: 0, rings: [] },
  monthlySales: { label: "Monthly Sales", value: "—", changePct: 0 },
  monthlyPurchase: { label: "Monthly Purchase", value: "—", changePct: 0 },
};

function DashboardHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showManagerInfo = isManagerUser();
  const [rpView, setRpView] = useState("chart");
  const [stockPeriod, setStockPeriod] = useState("month");
  const [userPeriod, setUserPeriod] = useState("month");
  /** User distribution donut: null → center 100%; hover label → that segment %. */
  const [userDistHover, setUserDistHover] = useState(null);
  const [managerQ, setManagerQ] = useState("");
  const [orderQ, setOrderQ] = useState("");
  const [orderDates, setOrderDates] = useState(null);
  const [orderSortOpen, setOrderSortOpen] = useState(false);
  /** Client-side sort of API results (same labels as order list). */
  const [orderSort, setOrderSort] = useState("newest");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detail, setDetail] = useState(null);
  const [salesModal, setSalesModal] = useState({
    open: false,
    sourceRow: null,
  });
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptDraft, setReceiptDraft] = useState(null);

  const refreshOrderDetail = async (row) => {
    if (!row) return;
    const id = row._id || row["Order ID"];
    try {
      const res = await quotationsApi.getById(id);
      const doc = res?.data;
      setDetail(doc ? salesDocToOrderDetailShape(doc) : null);
    } catch {
      try {
        const { data } = await dashboardUiApi.getOrder(id);
        setDetail(data.detail || null);
      } catch {
        setDetail(null);
      }
    }
  };

  const openOrderDrawer = async (row) => {
    setSelectedRow(row);
    setDrawerOpen(true);
    setDetail(null);
    await refreshOrderDetail(row);
  };

  const handleOrderStatusUpdated = async (newStatus) => {
    await queryClient.invalidateQueries({ queryKey: ["dashboard", "orders"] });
    if (selectedRow) {
      setSelectedRow((prev) =>
        prev ? { ...prev, "Order Status": newStatus } : prev
      );
      await refreshOrderDetail(selectedRow);
    }
  };

  const openReceiptFromOrder = async (row) => {
    const id = row?._id || row?.["Order ID"];
    if (!id) {
      toast.error("This order has no id — cannot create receipt.");
      return;
    }
    const orderLabel = row["Order ID"] || id;
    let party = String(row["Client Name"] || "").trim();
    let amount = parseRupeeCell(row["Due"]);
    if (!amount) amount = parseRupeeCell(row["Total Amount"]);
    let receivedIn = "";

    try {
      const res = await quotationsApi.getById(id);
      const doc = res?.data;
      if (doc) {
        const payStatus = String(doc.paymentStatus || "").trim();
        const total = Number(doc.totalAmount) || 0;
        const paid = Number(doc.paidAmount) || 0;
        if (payStatus === "Paid" || (total > 0 && paid >= total)) {
          toast.error("This order is already fully paid.");
          return;
        }
        party = String(doc.partyName || party).trim();
        const outstanding = Math.max(0, total - paid);
        amount = outstanding > 0 ? outstanding : total;
        const pm = String(doc.paymentMode || "").trim().toLowerCase();
        if (pm === "cash") receivedIn = "Cash";
        else if (pm === "bank" || pm === "online" || pm === "cheque") {
          receivedIn = "Bank";
        }
      }
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not load order for receipt"));
      return;
    }

    if (!party) {
      toast.error("This order has no client name — cannot create receipt.");
      return;
    }
    if (!amount) {
      toast.error("Cannot create a receipt voucher for ₹0.");
      return;
    }

    setReceiptDraft({
      date: dayjs().format("YYYY-MM-DD"),
      receiptFrom: party,
      amount: String(amount),
      receivedIn,
      remarks: `Receipt for order ${orderLabel}`,
      status: "Paid",
      sourceQuotationId: String(id),
    });
    setReceiptModalOpen(true);
  };

  const openSalesVoucherFromOrder = (row) => {
    const id = row?._id || row?.["Order ID"];
    if (!id) {
      toast.error("This order has no id — cannot create a sales voucher.");
      return;
    }
    setSalesModal({ open: true, sourceRow: { _id: String(id) } });
  };

  const {
    data: overviewPayload,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboard", "overview", stockPeriod, userPeriod],
    queryFn: async () => {
      const { data } = await dashboardUiApi.getOverview({
        stockPeriod,
        userPeriod,
      });
      return { ...defaultOverview, ...data };
    },
  });

  const overview = overviewPayload ?? defaultOverview;
  const statKpis = useMemo(
    () => mergeStatKpis(overview.kpis),
    [overview.kpis]
  );

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load dashboard"));
    }
  }, [isError, error]);

  useEffect(() => {
    setUserDistHover(null);
  }, [userPeriod]);

  const ordersQueryKey = useMemo(
    () => [
      "dashboard",
      "orders",
      "list",
      "all",
      "all",
      "all",
      "all",
      managerQ,
      orderQ,
      orderDates?.[0] || "",
      orderDates?.[1] || "",
    ],
    [managerQ, orderQ, orderDates]
  );

  const {
    data: ordersFromApi = [],
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrObj,
  } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      const { data } = await dashboardUiApi.getOrders({
        tab: "all",
        clientName: "",
        orderStatus: "all",
        paymentStatus: "all",
        managerName: managerQ,
        orderId: orderQ,
        dateFrom: orderDates?.[0] || "",
        dateTo: orderDates?.[1] || "",
      });
      return data.orders || [];
    },
  });

  useEffect(() => {
    if (ordersError && ordersErrObj) {
      toast.error(getApiErrorMessage(ordersErrObj, "Could not load orders"));
    }
  }, [ordersError, ordersErrObj]);

  const dashboardOrders = useMemo(() => {
    const list = [...ordersFromApi];
    const parseTot = (row) => {
      const s = String(row["Total Amount"] ?? "").replace(/[₹,\s]/g, "");
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };
    const byDate = (a, b) =>
      String(a.Date || "").localeCompare(String(b.Date || ""));
    switch (orderSort) {
      case "oldest":
      case "delivery":
        return list.sort(byDate);
      case "newest":
        return list.sort((a, b) => -byDate(a, b));
      case "amountHigh":
        return list.sort((a, b) => parseTot(b) - parseTot(a));
      case "amountLow":
        return list.sort((a, b) => parseTot(a) - parseTot(b));
      default:
        return list;
    }
  }, [ordersFromApi, orderSort]);

  const orderColumns = useMemo(
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

  const dashboardBadgeClasses = (type, rawValue) => {
    const value = String(rawValue ?? "").trim().toLowerCase().replace(/\s+/g, "");
    const base =
      "inline-flex min-w-19 items-center justify-center rounded-full border px-0 py-1 text-[10px] font-semibold leading-none tracking-wide";

    if (type === "payment") {
      if (value === "paid") {
        return `${base} border-emerald-300/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/45 dark:bg-emerald-500/18 dark:text-emerald-50`;
      }
      if (value === "pending") {
        return `${base} border-amber-300/80 bg-amber-50 text-amber-700 dark:border-amber-400/45 dark:bg-amber-500/16 dark:text-amber-50`;
      }
      return `${base} border-slate-300/90 bg-slate-100 text-slate-700 dark:border-slate-500/40 dark:bg-slate-500/18 dark:text-slate-100`;
    }

    const orderTone = {
      approved:
        "border-emerald-300/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/45 dark:bg-emerald-500/18 dark:text-emerald-50",
      processing:
        "border-sky-300/80 bg-sky-50 text-sky-700 dark:border-sky-400/45 dark:bg-sky-500/18 dark:text-sky-50",
      dispatched:
        "border-violet-300/80 bg-violet-50 text-violet-700 dark:border-violet-400/45 dark:bg-violet-500/18 dark:text-violet-50",
      pending:
        "border-amber-300/80 bg-amber-50 text-amber-700 dark:border-amber-400/45 dark:bg-amber-500/16 dark:text-amber-50",
      cancelled:
        "border-rose-300/80 bg-rose-50 text-rose-700 dark:border-rose-400/45 dark:bg-rose-500/18 dark:text-rose-50",
      partsupply:
        "border-orange-300/80 bg-orange-50 text-orange-700 dark:border-orange-400/45 dark:bg-orange-500/16 dark:text-orange-50",
      "part-supply":
        "border-orange-300/80 bg-orange-50 text-orange-700 dark:border-orange-400/45 dark:bg-orange-500/16 dark:text-orange-50",
    };
    return `${base} ${
      orderTone[value] ||
      "border-slate-300/90 bg-slate-100 text-slate-700 dark:border-slate-500/35 dark:bg-slate-500/15 dark:text-slate-200"
    }`;
  };

  const renderRowCell = (key, value, _row) => {
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
    if (key === "Payment Status") {
      return (
        <td key={key} className={orderTableTdClasses(key)}>
          <div className="flex min-h-0 items-center justify-center overflow-hidden py-0.5">
            <span className={dashboardBadgeClasses("payment", value)}>
              {value}
            </span>
          </div>
        </td>
      );
    }
    if (key === "Order Status") {
      return (
        <td key={key} className={orderTableTdClasses(key)}>
          <div className="flex min-h-0 items-center justify-center overflow-hidden py-0.5">
            <span className={dashboardBadgeClasses("order", value)}>
              {value ?? "—"}
            </span>
          </div>
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

  const invoiceData = detail?.invoice;

  const renderOrderAction = (row) => (
    <td className={orderTableTdClasses("Actions")}>
      <div className={TABLE_ACTIONS_ROW_DENSE}>
        <button
          type="button"
          title="View order"
          className={TABLE_ACTION_ICON_BTN_DENSE}
          onClick={() => openOrderDrawer(row)}
        >
          <IoEyeOutline size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Create receipt voucher — record payment received"
          className={TABLE_ACTION_ICON_BTN_DENSE}
          disabled={String(row["Payment Status"]).toLowerCase() === "paid"}
          onClick={() => openReceiptFromOrder(row)}
        >
          <Receipt size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Create sales voucher from this order"
          className={TABLE_ACTION_ICON_BTN_DENSE}
          onClick={() => openSalesVoucherFromOrder(row)}
        >
          <ScrollText size={14} strokeWidth={2} />
        </button>
        <button type="button" title="Schedule" className={TABLE_ACTION_ICON_BTN_DENSE}>
          <CalendarDays size={14} strokeWidth={2} />
        </button>
      </div>
    </td>
  );

  const th = (label) => (
    <th key={label} className={orderTableThClasses(label)}>
      {label}
    </th>
  );

  const st = { ...defaultOverview.salesTarget, ...overview.salesTarget };
  const primaryPct = Math.min(
    100,
    Math.round((st.achievedAmount / Math.max(1, st.targetAmount)) * 100)
  );
  const revenueDisplay =
    typeof st.totalRevenueAmount === "number" && st.totalRevenueAmount > 0
      ? st.totalRevenueAmount
      : st.secondaryAchieved || st.achievedAmount;
  const trendPct = Number(st.revenueTrendPct) || 0;
  const trendPositive = trendPct >= 0;

  const rp = overview.receivablesPayables;

  const goKpi = (key) => {
    const path = KPI_ROUTES[key];
    if (path) navigate(path);
    else navigate("/dashboard");
  };

  const TileInfo = ({ hint }) =>
    showManagerInfo ? (
      <button
        type="button"
        className="absolute top-3.5 right-3.5 z-10 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary cursor-pointer dark:hover:bg-slate-800 dark:hover:text-primary"
        title={hint}
        aria-label="Module info"
        onClick={(e) => {
          e.stopPropagation();
          toast(hint, { duration: 4000 });
        }}
      >
        <Info size={15} strokeWidth={2} />
      </button>
    ) : null;

  return (
    <DashboardLayout>
      <div className="ds-stack-page min-w-0">
        <div className="grid grid-cols-1 items-stretch gap-3 min-[480px]:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {statKpis.map((k) => {
            const Icon = STAT_ICONS[k.key] || PackagePlus;
            return (
              <DashboardStatCard
                key={k.key}
                className="h-full min-h-0"
                label={k.label}
                value={k.value}
                loading={loading}
                icon={Icon}
                variant={k.variant}
                trend={k.trend}
                onActivate={() => goKpi(k.key)}
                infoSlot={
                  <TileInfo hint={KPI_INFO[k.key] || "Open module"} />
                }
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 items-stretch xl:grid-cols-2">
          <CustomerSummaryCard />

          <div className="rounded-xl jitox-panel p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] flex flex-col min-h-[240px]">
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-base font-bold text-slate-900 tracking-tight dark:text-slate-100">
                Receivables / Payables
              </span>
              <div className="flex rounded-lg border border-slate-200/90 bg-slate-50/80 p-0.5 dark:border-slate-600 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setRpView("list")}
                  className={`p-2 rounded-md transition cursor-pointer ${rpView === "list" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100 dark:shadow-md" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
                  aria-label="List view"
                >
                  <LuList size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setRpView("chart")}
                  className={`p-2 rounded-md transition cursor-pointer ${rpView === "chart" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100 dark:shadow-md" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"}`}
                  aria-label="Chart view"
                >
                  <LuLayoutGrid size={17} />
                </button>
              </div>
            </div>
            {rpView === "chart" && rp?.months?.length ? (
              <>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400 mb-3 mt-2">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#EAB308]" />
                    Receivables
                  </span>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#2563EB]" />
                    Payables
                  </span>
                </div>
                <StackedBars
                  months={rp.months}
                  a={rp.receivables}
                  b={rp.payables}
                  labels={["Receivables", "Payables"]}
                />
              </>
            ) : rp?.months?.length ? (
              <div className="mt-2 min-w-0 overflow-hidden rounded-lg border border-light-border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="max-h-90 min-w-0 overflow-x-auto overflow-y-auto overscroll-y-contain text-xs">
                  <table className="w-full min-w-full table-fixed border-collapse text-left">
                    <thead className="sticky top-0 z-10 border-b border-sky-200/90 bg-sky-50 dark:border-sky-800/70 dark:bg-sky-950/55">
                      <tr>
                        <th
                          scope="col"
                          className="w-[42%] rounded-tl-lg py-2.5 pl-3 pr-2 align-middle text-left text-[11px] font-semibold uppercase tracking-wider text-sky-900 dark:text-sky-100"
                        >
                          Month
                        </th>
                        <th
                          scope="col"
                          className="w-[29%] py-2.5 pr-2 align-middle text-right text-[11px] font-semibold uppercase tracking-wider tabular-nums text-sky-900 dark:text-sky-100"
                        >
                          Rec.
                        </th>
                        <th
                          scope="col"
                          className="w-[29%] rounded-tr-lg py-2.5 pr-3 align-middle text-right text-[11px] font-semibold uppercase tracking-wider tabular-nums text-sky-900 dark:text-sky-100"
                        >
                          Pay.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border/80 dark:divide-slate-700/90">
                      {rp.months.map((m, i) => (
                        <tr
                          key={m}
                          className="transition-colors duration-200 hover:bg-emerald-50/50 dark:hover:bg-slate-800/70"
                        >
                          <td className="py-2.5 pl-3 pr-2 align-middle whitespace-nowrap text-slate-900 dark:text-slate-100">
                            {m}
                          </td>
                          <td className="py-2.5 pr-2 align-middle tabular-nums text-right whitespace-nowrap text-slate-800 dark:text-slate-200">
                            ₹{(rp.receivables[i] ?? 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 pr-3 align-middle tabular-nums text-right whitespace-nowrap text-slate-800 dark:text-slate-200">
                            ₹{(rp.payables[i] ?? 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex-1 text-sm text-light flex items-center justify-center py-10 dark:text-slate-500">
                No chart data
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl jitox-panel p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)]">
          <div className="mb-3 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            All Orders
          </div>
          <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2.5 lg:mb-4 lg:gap-3">
            <SearchBar
              dense
              value={managerQ}
              onChange={setManagerQ}
              placeholder="Search Manager Name"
              className="w-full min-w-0 shrink-0 sm:w-48"
            />
            <SearchBar
              dense
              value={orderQ}
              onChange={setOrderQ}
              placeholder="Search Order ID"
              className="w-full min-w-0 shrink-0 sm:w-48"
            />
            <DateRangePicker
              filterBar
              placeholder={["Date", "Date"]}
              className="min-w-0 shrink w-auto flex-1 sm:w-52 sm:flex-none [&_.ant-picker-input>input]:font-medium [&_.ant-picker-input>input]:text-slate-900 [&_.ant-picker-input>input]:placeholder:text-slate-600 [&_.ant-picker-separator]:text-slate-700 dark:[&_.ant-picker-input>input]:text-slate-100 dark:[&_.ant-picker-input>input]:placeholder:text-slate-400 dark:[&_.ant-picker-separator]:text-slate-400"
              value={orderDates}
              onChange={setOrderDates}
            />
            <div className="relative ml-auto flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => setOrderSortOpen((o) => !o)}
                className="box-border flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white p-0 text-light shadow-sm hover:bg-slate-50 hover:text-primary dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-primary"
                aria-label="Sort"
              >
                <LuArrowUpDown size={16} />
              </button>
              {orderSortOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-md dark:border-slate-600 dark:bg-slate-900">
                  {[
                    { label: "Newest First", value: "newest" },
                    { label: "Oldest First", value: "oldest" },
                    { label: "Highest Amount", value: "amountHigh" },
                    { label: "Lowest Amount", value: "amountLow" },
                    { label: "Delivery Date", value: "delivery" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800 ${
                        orderSort === opt.value ? "bg-emerald-50 dark:bg-emerald-950/40" : ""
                      }`}
                      onClick={() => {
                        setOrderSort(opt.value);
                        setOrderSortOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <OrdersTableShell>
            <thead>
              <tr>{orderColumns.map((c) => th(c))}</tr>
            </thead>
            <TableContent
              variant="ordersDense"
              columns={orderColumns}
              data={ordersLoading ? [] : dashboardOrders}
              renderRowCell={renderRowCell}
              renderAction={renderOrderAction}
            />
          </OrdersTableShell>
          {!ordersLoading && dashboardOrders.length === 0 && (
            <div className="px-3 py-4 text-center text-xs leading-relaxed text-slate-500 border border-t-0 border-slate-200/90 rounded-b-lg bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              No orders in this view
            </div>
          )}
          {ordersLoading && (
            <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Loading orders…
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 items-stretch xl:grid-cols-2">
          <div className="rounded-xl jitox-panel jitox-panel--shadow p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-dark mb-4">Sales Target</h2>
            <div className="grid grid-cols-2 gap-4 flex-1 content-start">
              <div>
                <p className="text-xs text-light mb-2">In Progress</p>
                <p className="text-lg sm:text-xl font-bold text-dark tabular-nums leading-tight">
                  ₹{st.achievedAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-light mb-2">{st.targetLabel}</p>
                <p className="text-lg sm:text-xl font-bold text-dark tabular-nums leading-tight">
                  ₹{st.targetAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="mt-5 relative pt-1">
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-300 via-lime-400 to-emerald-500 transition-[width] duration-500"
                  style={{ width: `${primaryPct}%` }}
                />
              </div>
              <div
                className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-emerald-500 border-2 border-white shadow-md ring-1 ring-slate-200/90 pointer-events-none"
                style={{
                  left: `clamp(0px, calc(${primaryPct}% - 8px), calc(100% - 16px))`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow flex flex-col gap-3 px-3 pt-4 pb-4 sm:flex-row sm:items-stretch sm:gap-4 sm:p-4 min-h-0 sm:min-h-[200px] max-sm:items-stretch">
            <div className="flex w-full min-w-0 flex-none items-center justify-center sm:flex-1 sm:items-end sm:justify-start sm:pb-1">
              <RevenueSparkline series={st.revenueSparkline} />
            </div>
            <div className="flex w-full flex-none flex-col justify-center gap-1 text-center max-sm:pb-0.5 sm:flex-1 sm:gap-2 sm:text-right">
              <p className="text-lg sm:text-2xl font-bold text-dark tabular-nums leading-tight">
                ₹{revenueDisplay.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-light">Total Revenue</p>
              <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-1.5 text-sm font-semibold">
                {trendPositive ? (
                  <TrendingUp
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                ) : (
                  <TrendingDown
                    className="h-4 w-4 shrink-0 text-rose-600"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                )}
                <span
                  className={trendPositive ? "text-emerald-600" : "text-rose-600"}
                >
                  {trendPositive ? "+" : ""}
                  {trendPct}%
                </span>
              </div>
              <p className="text-[11px] text-light">
                {st.revenueTrendLabel || "From last week"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 items-stretch md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl jitox-panel jitox-panel--shadow p-4 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-sm font-semibold text-dark">
                Current Stock
              </span>
              <PeriodToggle value={stockPeriod} onChange={setStockPeriod} />
            </div>
            <div className="grid grid-cols-2 gap-3 flex-1 content-start sm:grid-cols-3">
              {(overview.stockItems || []).slice(0, 9).map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className="rounded-lg border border-light-border p-3 text-center hover:border-primary/40 transition cursor-pointer"
                  onClick={() => navigate("/dashboard/stock")}
                >
                  <div className="text-[10px] text-light truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="text-xs font-semibold text-dark">{item.qty}</div>
                  {item.amountLabel ? (
                    <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      {item.amountLabel}
                    </div>
                  ) : null}
                  <div
                    className={`text-[10px] ${item.changePct >= 0 ? "text-primary" : "text-red-500"}`}
                  >
                    {item.changePct >= 0 ? "+" : ""}
                    {item.changePct}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow p-4 flex flex-col min-h-[220px]">
            <div className="text-sm font-semibold text-dark mb-3 leading-snug">
              Attendance Sheet
            </div>
            <ul className="space-y-2 text-sm flex-1 leading-relaxed">
              {[
                ["Present", overview.attendance?.present],
                ["Absent", overview.attendance?.absent],
                ["Late In", overview.attendance?.lateIn],
                ["Early Out", overview.attendance?.earlyOut],
              ].map(([label, val]) => (
                <li
                  key={label}
                  className="flex justify-between gap-4 border-b border-light-border/80 pb-2 last:border-0"
                >
                  <span className="text-light">{label}</span>
                  <span className="font-semibold text-dark tabular-nums">
                    {String(val ?? 0).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl jitox-panel jitox-panel--shadow p-4 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-sm font-semibold text-dark">
                User distribution
              </span>
              <PeriodToggle value={userPeriod} onChange={setUserPeriod} />
            </div>
            <div
              className="flex flex-1 flex-col items-center gap-4 sm:flex-row"
              onMouseLeave={() => setUserDistHover(null)}
            >
              {(() => {
                const distRings = overview.userDistribution?.rings || [];
                const hoveredRing = distRings.find((r) => r.label === userDistHover);
                const centerLabel = hoveredRing
                  ? `${hoveredRing.pct ?? 0}%`
                  : "100%";
                return (
                  <>
                    <div className="relative flex items-center justify-center w-[92px] h-[92px] shrink-0 overflow-visible">
                      <SegmentedDonutRing
                        segments={distRings}
                        hoveredLabel={userDistHover}
                        onSegmentEnter={setUserDistHover}
                        onSegmentLeave={() => setUserDistHover(null)}
                        size={92}
                        stroke={11}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-dark tabular-nums pointer-events-none select-none">
                        {centerLabel}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2 text-xs leading-relaxed">
                      {distRings.map((r) => (
                        <div
                          key={r.label}
                          role="presentation"
                          onMouseEnter={() => setUserDistHover(r.label)}
                          className={`flex w-full items-center gap-2 rounded-md px-1 py-0.5 transition ${
                            userDistHover === r.label
                              ? "bg-rowBg dark:bg-slate-800/80"
                              : ""
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: r.color }}
                          />
                          <span className="text-light truncate">{r.label}</span>
                          <span className="ml-auto font-medium tabular-nums">
                            {r.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <OrderDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        row={selectedRow}
        detail={detail}
        invoice={invoiceData}
        onOrderStatusUpdated={handleOrderStatusUpdated}
      />
      <SalesVoucherModal
        open={salesModal.open}
        onClose={() => setSalesModal({ open: false, sourceRow: null })}
        sourceRow={salesModal.sourceRow}
        sourceKind="quotation"
        mode="fromOrder"
      />
      <ReceiptModal
        open={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setReceiptDraft(null);
          queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard", "orders"] });
        }}
        draft={receiptDraft}
      />
    </DashboardLayout>
  );
}

export default DashboardHome;
