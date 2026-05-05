import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { DateRangePicker, CommonModal } from "../../components/ui/CommanUI";
import DashboardLayout from "../../layouts/DashboardLayout";
import { IoEyeOutline } from "react-icons/io5";
import { RiWhatsappFill } from "react-icons/ri";
import { BsFillFileEarmarkPdfFill } from "react-icons/bs";
import { TbMailFilled } from "react-icons/tb";
import { TiPrinter } from "react-icons/ti";
import { FcPrint } from "react-icons/fc";
import DataTable from "../../components/ui/table/DataTable";
import { printHtmlDocument } from "../../utils/printAndExport";
import { dayBooksApi } from "../../services/api";
import { getApiErrorMessage, isEmptyListNotFound } from "../../utils/apiError";
import { mapDayBooksToLedgerRows } from "../../utils/ledgerRowMapper";

const LEDGER_TITLE = "Day book ledger";

function docInDateRange(doc, dateRange) {
  if (!dateRange?.[0] || !dateRange?.[1]) return true;
  const ts = doc.createdAt ? new Date(doc.createdAt).getTime() : 0;
  const start = new Date(dateRange[0]);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateRange[1]);
  end.setHours(23, 59, 59, 999);
  return ts >= start.getTime() && ts <= end.getTime();
}

const LedgerTable = () => {
  const [dateRange, setDateRange] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [viewRow, setViewRow] = useState(null);

  const {
    data: rawDayBooks = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dayBooks", "all"],
    queryFn: async () => {
      try {
        const { data } = await dayBooksApi.getAll({});
        return Array.isArray(data) ? data : [];
      } catch (e) {
        if (isEmptyListNotFound(e)) return [];
        throw e;
      }
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load ledger"));
    }
  }, [isError, error]);

  const data = useMemo(() => {
    const filtered = rawDayBooks.filter((d) => docInDateRange(d, dateRange));
    const sorted = [...filtered].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
    return mapDayBooksToLedgerRows(sorted);
  }, [rawDayBooks, dateRange]);

  useEffect(() => {
    setSelectedRows([]);
  }, [data]);

  const toggleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((_, index) => index));
    }
  };

  const toggleRowSelect = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const columns = useMemo(
    () => [
      "Date",
      "Voucher Type",
      "Voucher No",
      "Particulars",
      "Debit ₹",
      "Credit ₹",
      "Balance ₹",
      "Actions",
    ],
    []
  );

  const closingLine = useMemo(() => {
    if (!data.length) return "No entries in range.";
    return `Closing balance: ${data[data.length - 1]["Balance ₹"]}`;
  }, [data]);

  const printLedgerRows = (rowsToPrint) => {
    const header =
      "<tr>" +
      columns
        .filter((c) => c !== "Actions")
        .map(
          (c) =>
            `<th style="padding:8px;border:1px solid #ddd;text-align:left">${String(
              c
            )}</th>`
        )
        .join("") +
      "</tr>";
    const body = rowsToPrint
      .map((row) => {
        const cells = columns
          .filter((c) => c !== "Actions")
          .map(
            (c) =>
              `<td style="padding:8px;border:1px solid #ddd">${String(
                row[c] ?? "—"
              )}</td>`
          )
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
    const html = `<p><strong>${LEDGER_TITLE}</strong></p><p>${closingLine}</p>
      <table style="border-collapse:collapse;width:100%"><thead>${header}</thead><tbody>${body}</tbody></table>`;
    printHtmlDocument(`Ledger — ${LEDGER_TITLE}`, html);
    toast.success(
      "Downloaded (.html). Open it and use Print → Save as PDF for a PDF copy."
    );
  };

  const renderLedgerActions = (row) => (
    <td className="px-3 py-2.5 align-middle border-b border-light-border dark:border-slate-700">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          title="View voucher line"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-500/70 bg-transparent text-slate-200 transition-colors duration-150 hover:border-emerald-400/70 hover:bg-emerald-400/10 hover:text-emerald-300"
          onClick={(e) => {
            e.stopPropagation();
            setViewRow(row);
          }}
        >
          <IoEyeOutline size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Print this line"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-500/70 bg-transparent text-slate-200 transition-colors duration-150 hover:border-emerald-400/70 hover:bg-emerald-400/10 hover:text-emerald-300"
          onClick={(e) => {
            e.stopPropagation();
            printLedgerRows([row]);
          }}
        >
          <TiPrinter size={18} />
        </button>
      </div>
    </td>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3 2xl:gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-base font-semibold text-dark">{LEDGER_TITLE}</div>

          <div className="flex gap-3 items-center">
            <div className="text-blue font-semibold">{closingLine}</div>
            <DateRangePicker
              filterBar
              value={dateRange}
              onChange={setDateRange}
              className="w-60"
            />
            <div className="flex items-center border border-light-border rounded-md text-lg bg-white">
              <button
                type="button"
                title="Print / save as PDF"
                className="p-2 border-r flex items-center border-light-border justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => printLedgerRows(data)}
              >
                <BsFillFileEarmarkPdfFill className="text-red" />
              </button>
              <button
                type="button"
                title="Share on WhatsApp"
                className="p-2 border-r flex items-center border-light-border justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  const text = encodeURIComponent(
                    `Jitox — ${LEDGER_TITLE}. ${closingLine}`
                  );
                  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
                }}
              >
                <RiWhatsappFill className="text-primary" />
              </button>
              <button
                type="button"
                title="Email summary"
                className="p-2 border-r flex items-center border-light-border justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  const sub = encodeURIComponent(`Jitox — ${LEDGER_TITLE}`);
                  const body = encodeURIComponent(`${closingLine}\n`);
                  window.location.href = `mailto:?subject=${sub}&body=${body}`;
                }}
              >
                <TbMailFilled className="text-light" />
              </button>
              <button
                type="button"
                title="Print ledger"
                className="p-2 flex items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => printLedgerRows(data)}
              >
                <FcPrint />
              </button>
            </div>
          </div>
        </div>

        {isError && (
          <p className="text-sm text-red-600">
            {getApiErrorMessage(error, "Could not load ledger.")}
          </p>
        )}

        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          enableSelect={true}
          selectedRows={selectedRows}
          toggleSelectAll={toggleSelectAll}
          toggleRowSelect={toggleRowSelect}
          renderAction={renderLedgerActions}
        />

        <CommonModal
          open={Boolean(viewRow)}
          onClose={() => setViewRow(null)}
          title="Voucher line"
          width="520px"
        >
          {viewRow && (
            <dl className="mb-0 space-y-2 text-sm">
              {Object.entries(viewRow).map(([k, v]) => (
                <div
                  key={k}
                  className="grid grid-cols-2 gap-2 border-b border-light-border pb-2 last:border-0"
                >
                  <dt className="text-light font-medium">{k}</dt>
                  <dd className="text-dark">{String(v ?? "—")}</dd>
                </div>
              ))}
            </dl>
          )}
        </CommonModal>
      </div>
    </DashboardLayout>
  );
};

export default LedgerTable;
