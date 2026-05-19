import React, { useState, useMemo } from "react";
import DataTable from "../../../components/ui/table/DataTable";
import { ChevronUp, ChevronDown, CalendarDays, Package, CircleDot } from "lucide-react";
import {
  TABLE_CELL_BORDER,
  tableTdClasses,
  tableThClasses,
  getTableCellAlignClass,
} from "../../../utils/tableUi";

/**
 * One `<dt>` + `<dd>` pair as direct children of a section `<dl>` that uses
 * `grid grid-cols-1 sm:grid-cols-[15rem_minmax(0,1fr)]` so every value shares the same start edge.
 */
function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <dt className="w-28 shrink-0 whitespace-nowrap text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:w-32 sm:text-xs">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right wrap-break-word text-[11px] font-normal leading-tight text-slate-900 sm:text-xs dark:text-slate-100">
        {children}
      </dd>
    </div>
  );
}

const OrdersPlacedTab = ({ orders: ordersProp, liveData = false }) => {
  const [expandedRow, setExpandedRow] = useState(0);
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const columns = [
    "Order Number",
    "Date & Time",
    "Placed By",
    "Client Name",
    "Order Status",
    "Payment Status",
  ];

  const data = useMemo(
    () => {
      if (liveData) return Array.isArray(ordersProp) ? ordersProp : [];
      if (ordersProp?.length) return ordersProp;
      return [
      {
        id: 0,
        "Order Number": "ORD-0035",
        "Date & Time": "03 Jul 2025, 03:15 PM",
        "Placed By": "Anita Mehra",
        "Client Name": "Rajeev Sharma",
        "Order Status": "In Process",
        "Payment Status": "Pending",
        personDetails: {
          contact: "+91-9876543210",
          address: "101, Shree Residency, Surat, Gujarat",
          fullAddress:
            "101, Shree Residency\nNear Bus Stand\nSurat, Gujarat - 395007\nIndia",
          assignedDeliveryPerson: "Ajay Bhatt",
        },
        dispatchDetails: {
          paymentMethod: "Debit Card",
          dispatchStatus: "Pending",
          expectedDeliveryDate: "05 Jul 2025",
        },
        items: [
          {
            description: "Organic Fertilizer",
            qty: "50 Kg",
            rate: "₹400",
            amount: "20,000",
          },
          {
            description: "Liquid Pesticide",
            qty: "10 L",
            rate: "₹200",
            amount: "2,000",
          },
        ],
        total: "22,000",
      },
      {
        id: 1,
        "Order Number": "ORD-0036",
        "Date & Time": "04 Jul 2025, 11:00 AM",
        "Placed By": "Anita Mehra",
        "Client Name": "Vikas Patel",
        "Order Status": "In Process",
        "Payment Status": "In Process",
      },
    ];
    },
    [ordersProp, liveData]
  );

  const orderNumberOptions = useMemo(() => {
    const seen = new Set(
      data
        .map((d) => String(d["Order Number"] || "").trim())
        .filter(Boolean)
    );
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [data]);

  const dateOptions = useMemo(() => {
    const seen = new Set(
      data
        .map((d) => String(d["Date & Time"] || "").trim())
        .filter(Boolean)
    );
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [data]);

  const statusOptions = useMemo(() => {
    const seen = new Set(
      data
        .map((d) => String(d["Order Status"] || "").trim())
        .filter(Boolean)
    );
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (orderNumberFilter && String(row["Order Number"]) !== orderNumberFilter)
        return false;
      if (dateFilter && String(row["Date & Time"]) !== dateFilter) return false;
      if (statusFilter && String(row["Order Status"]) !== statusFilter)
        return false;
      return true;
    });
  }, [data, orderNumberFilter, dateFilter, statusFilter]);

  const renderCustomRow = (row, rowIndex) => {
    const isExpanded = expandedRow === rowIndex;
    const rowBg =
      rowIndex % 2 === 0
        ? "bg-white dark:bg-slate-950"
        : "bg-slate-50/80 dark:bg-slate-900/90";

    return (
      <React.Fragment key={rowIndex}>
        <tr
          className={`group align-middle transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/80 ${rowBg}`}
        >
          <td className={tableTdClasses("Order Number")}>
            <span className="text-slate-800 dark:text-slate-100">
              {row["Order Number"]}
            </span>
          </td>
          <td className={tableTdClasses("Date & Time")}>
            <span className="text-slate-800 dark:text-slate-100">
              {row["Date & Time"]}
            </span>
          </td>
          <td className={tableTdClasses("Placed By")}>
            <span className="text-slate-800 dark:text-slate-100">
              {row["Placed By"]}
            </span>
          </td>
          <td className={tableTdClasses("Client Name")}>
            <span className="text-slate-800 dark:text-slate-100">
              {row["Client Name"]}
            </span>
          </td>
          <td className={tableTdClasses("Order Status")}>
            <span className="font-semibold text-amber-600 dark:text-amber-400/95">
              {row["Order Status"]}
            </span>
          </td>
          <td className={`${tableTdClasses("Payment Status")} relative`}>
            <div className="flex w-full min-w-0 items-center justify-center gap-2 sm:justify-between">
              <span className="min-w-0 truncate font-semibold text-amber-600 dark:text-amber-400/95">
                {row["Payment Status"]}
              </span>
              <button
                type="button"
                onClick={() => setExpandedRow(isExpanded ? null : rowIndex)}
                className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse row" : "Expand row"}
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </td>
        </tr>

        {isExpanded && row.personDetails && row.dispatchDetails && (
          <tr className={rowBg}>
            <td
              colSpan={6}
              className={`${TABLE_CELL_BORDER} border-t-0 bg-slate-50/90 px-2 py-2 sm:px-3 sm:py-3 dark:bg-slate-950/50`}
            >
              <div className="max-sm:max-h-[70vh] max-sm:overflow-y-auto">
                <div className="grid min-w-0 gap-1.5 lg:grid-cols-2">
                  <div className="min-w-0 rounded-md border border-slate-200 bg-white px-1.5 py-1 dark:border-slate-600 dark:bg-slate-900">
                    <h4 className="mb-0.5 text-xs font-bold text-slate-900 sm:text-[13px] dark:text-slate-100">
                      Person Details
                    </h4>
                    <dl>
                      <DetailRow label="Contact">
                        {row.personDetails.contact}
                      </DetailRow>
                      <DetailRow label="Address">
                        <span
                          className="line-clamp-1"
                          title={row.personDetails.fullAddress || row.personDetails.address}
                        >
                          {(row.personDetails.fullAddress || row.personDetails.address || "").replace(
                            /\n+/g,
                            ", "
                          )}
                        </span>
                      </DetailRow>
                      <DetailRow label="Assigned delivery person">
                        {row.personDetails.assignedDeliveryPerson}
                      </DetailRow>
                    </dl>
                  </div>

                  <div className="min-w-0 rounded-md border border-slate-200 bg-white px-1.5 py-1 dark:border-slate-600 dark:bg-slate-900">
                    <h4 className="mb-0.5 text-xs font-bold text-slate-900 sm:text-[13px] dark:text-slate-100">
                      Dispatch Details
                    </h4>
                    <dl>
                      <DetailRow label="Payment method">
                        {row.dispatchDetails.paymentMethod}
                      </DetailRow>
                      <DetailRow label="Dispatch status">
                        {row.dispatchDetails.dispatchStatus}
                      </DetailRow>
                      <DetailRow label="Expected delivery date">
                        {row.dispatchDetails.expectedDeliveryDate}
                      </DetailRow>
                    </dl>
                  </div>
                </div>

                <div className="mt-2 overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 bg-white max-sm:max-h-48 [-webkit-overflow-scrolling:touch] touch-pan-x dark:border-slate-600 dark:bg-slate-900 sm:mt-3">
                  <table className="w-full min-w-[30rem] border-collapse text-xs sm:min-w-0 sm:text-sm">
                    <thead>
                      <tr>
                        <th className={`${tableThClasses("Description")} px-2 py-1.5`}>
                          Description
                        </th>
                        <th className={`${tableThClasses("Qty")} px-2 py-1.5`}>Qty</th>
                        <th className={`${tableThClasses("Rate")} px-2 py-1.5`}>Rate</th>
                        <th className={`${tableThClasses("Amount")} px-2 py-1.5`}>
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.items.map((item, idx) => (
                        <tr
                          key={idx}
                          className={
                            idx % 2 === 0
                              ? "bg-white dark:bg-slate-950"
                              : "bg-slate-50/80 dark:bg-slate-900/90"
                          }
                        >
                          <td className={tableTdClasses("Description", { dense: true })}>
                            {item.description}
                          </td>
                          <td className={tableTdClasses("Qty", { dense: true })}>
                            {item.qty}
                          </td>
                          <td className={tableTdClasses("Rate", { dense: true })}>
                            {item.rate}
                          </td>
                          <td className={tableTdClasses("Amount", { dense: true })}>
                            {item.amount}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-200 bg-slate-50/95 dark:border-slate-600 dark:bg-slate-800/80">
                        <td
                          colSpan={3}
                          className={`${TABLE_CELL_BORDER} px-2.5 py-2.5 text-left text-xs font-bold text-slate-900 dark:text-slate-100`}
                        >
                          Total
                        </td>
                        <td
                          className={`${TABLE_CELL_BORDER} px-2.5 py-2.5 ${getTableCellAlignClass("Amount")} text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100`}
                        >
                          {row.total}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-fit max-w-full flex-nowrap items-center gap-0.5 rounded-lg bg-slate-100/90 p-0.5 whitespace-nowrap dark:bg-slate-800/80">
          <button
            type="button"
            className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm ring-1 ring-primary/15 dark:bg-slate-900 dark:ring-primary/25 sm:rounded-lg sm:px-4 sm:py-1 sm:text-[13px]"
          >
            My Data
          </button>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 sm:rounded-lg sm:px-4 sm:py-1 sm:text-[13px]"
          >
            User (10)
          </button>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
          <div className="relative w-full sm:w-44">
            <Package
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={orderNumberFilter}
              onChange={(e) => setOrderNumberFilter(e.target.value)}
              aria-label="Filter by order number"
            >
              <option value="">Order Number</option>
              {orderNumberOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-44">
            <CalendarDays
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
            >
              <option value="">Date</option>
              {dateOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-44">
            <CircleDot
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              className="h-9 w-full rounded-lg border border-light-border bg-white pl-7 pr-2 text-[13px] text-dark dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by order status"
            >
              <option value="">Order Status</option>
              {statusOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} renderCustomRow={renderCustomRow} />
    </div>
  );
};

export default OrdersPlacedTab;
