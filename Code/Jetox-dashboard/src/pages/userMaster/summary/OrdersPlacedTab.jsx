import React, { useState, useMemo } from "react";
import DataTable from "../../../components/ui/table/DataTable";
import { ChevronUp, ChevronDown } from "lucide-react";
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
    <>
      <dt className="py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:pr-2 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 py-2.5 text-left wrap-break-word text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:text-sm">
        {children}
      </dd>
    </>
  );
}

const OrdersPlacedTab = () => {
  const [expandedRow, setExpandedRow] = useState(0);

  const columns = [
    "Order Number",
    "Date & Time",
    "Placed By",
    "Client Name",
    "Order Status",
    "Payment Status",
  ];

  const data = useMemo(
    () => [
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
    ],
    []
  );

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
            <span className="font-semibold italic text-amber-600 dark:text-amber-400/95">
              {row["Order Status"]}
            </span>
          </td>
          <td className={`${tableTdClasses("Payment Status")} relative`}>
            <div className="flex w-full min-w-0 items-center justify-center gap-2 sm:justify-between">
              <span className="min-w-0 truncate font-semibold italic text-amber-600 dark:text-amber-400/95">
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
              className={`${TABLE_CELL_BORDER} border-t-0 bg-slate-50/90 px-3 py-3 sm:px-4 sm:py-4 dark:bg-slate-950/50`}
            >
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
                <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-slate-200 dark:lg:divide-slate-600">
                  <div className="min-w-0 lg:pr-6 xl:pr-8">
                    <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      Person Details
                    </h4>
                    <dl className="grid grid-cols-1 items-start gap-x-0 gap-y-0 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-x-3">
                      <DetailRow label="Contact">
                        {row.personDetails.contact}
                      </DetailRow>
                      <DetailRow label="Address">
                        <span title={row.personDetails.fullAddress || row.personDetails.address}>
                          {row.personDetails.fullAddress
                            ? row.personDetails.fullAddress.split("\n").map((line, i) => (
                                <React.Fragment key={i}>
                                  {i > 0 ? <br /> : null}
                                  {line}
                                </React.Fragment>
                              ))
                            : row.personDetails.address}
                        </span>
                      </DetailRow>
                      <DetailRow label="Assigned delivery person">
                        {row.personDetails.assignedDeliveryPerson}
                      </DetailRow>
                    </dl>
                  </div>

                  <div className="min-w-0 lg:pl-6 xl:pl-8">
                    <h4 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      Dispatch Details
                    </h4>
                    <dl className="grid grid-cols-1 items-start gap-x-0 gap-y-0 sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-x-3">
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

                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className={tableThClasses("Description")}>Description</th>
                        <th className={tableThClasses("Qty")}>Qty</th>
                        <th className={tableThClasses("Rate")}>Rate</th>
                        <th className={tableThClasses("Amount")}>Amount</th>
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
      <DataTable columns={columns} data={data} renderCustomRow={renderCustomRow} />
    </div>
  );
};

export default OrdersPlacedTab;
