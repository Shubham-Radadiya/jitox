import { Eye, FileText, PenLine, Search } from "lucide-react";
import { Button, CommonModal } from "../../components/ui/CommanUI";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreateAccountModal from "./CreateAccountModal";
import DataTable from "../../components/ui/table/DataTable";
import {
  accountsApi,
  customersApi,
  paymentVouchersApi,
  receiptVouchersApi,
  journalVouchersApi,
  purchaseVouchersApi,
  purchaseReturnVouchersApi,
  expenseVouchersApi,
  cashVouchersApi,
} from "../../services/api";
import toast from "react-hot-toast";
import { getApiErrorMessage, isEmptyListNotFound } from "../../utils/apiError";
import { mapAccountToRow } from "../../utils/accountMappers";
import { isAdminUser } from "../../utils/authSession";
import { useTableData } from "../../hooks/useTableData";
import {
  escapeHtml,
  buildStandalonePrintableHtml,
  downloadHtmlDocumentAsPdf,
} from "../../utils/printAndExport";
import { fmtRupee } from "../../utils/voucherRowMappers";
import {
  TABLE_ACTION_ICON_BTN,
  tableTdClasses,
  tableFooterTdClasses,
} from "../../utils/tableUi";
import { mergePageAddButton } from "../../utils/pageAddButton";
import {
  accountOpeningMeta,
  buildPartyTransactionEntries,
  normalizeList,
} from "../../utils/partyLedgerTx";

function parseInrCell(v) {
  if (v == null || v === "—") return 0;
  const n = Number(String(v).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatStatementDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
}

/** Same rupee display as normal statement PDF cells (no ₹ prefix). */
function fmtStatementCellAmount(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x === 0) return "";
  return fmtRupee(x).replace("₹", "");
}

/** Detail lines (products / tax) — thousands + 2 decimals like invoice snippet. */
function fmtStatementDetailTwoDecimals(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x === 0) return "";
  return x.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Matches detail PDF thead `background:#eee` for product / CGST / SGST sub-rows. */
const DETAIL_BAND_BG = "#eee";

function buildStatementTableRowsHtml(rows, opts = {}) {
  const bordered = Boolean(opts.bordered);

  const mkTd = (inner, extraStyle = "") => {
    const parts = [];
    if (bordered) {
      parts.push("border:1px solid #ccc", "padding:4px", "vertical-align:middle");
    }
    if (extraStyle) parts.push(extraStyle);
    const st = parts.length ? ` style="${parts.join(";")}"` : "";
    return `<td${st}>${inner}</td>`;
  };

  return rows
    .map((r) => {
      const bandBg =
        bordered && r.detailBandBg
          ? `background-color:${DETAIL_BAND_BG}`
          : "";
      let particularsCell;
      if (r.particularsHtml != null) {
        particularsCell = r.particularsHtml;
      } else if (r.plainParticulars) {
        particularsCell = escapeHtml(r.particulars ?? "—");
      } else {
        particularsCell = `<strong>${escapeHtml(r.particulars ?? "—")}</strong>`;
      }

      /** Stop voucher no. / type wrapping onto a second line (looks like “2 rows”). */
      const vtStyle = `${
        r.numericDetailColumns ? "text-align:right" : "text-align:center"
      };white-space:nowrap`;
      const vnStyle = `${
        r.numericDetailColumns ? "text-align:right" : "text-align:center"
      };white-space:nowrap`;
      const amtAlign = "text-align:right;white-space:nowrap";

      const tdBand = bandBg ? `${bandBg};` : "";

      return `<tr>
            ${mkTd(escapeHtml(r.date ?? ""), "")}
            ${mkTd(particularsCell, tdBand)}
            ${mkTd(escapeHtml(r.voucherType ?? ""), `${tdBand}${vtStyle}`)}
            ${mkTd(escapeHtml(r.voucherNo ?? ""), `${tdBand}${vnStyle}`)}
            ${mkTd(escapeHtml(r.debit ?? ""), `${tdBand}${amtAlign}`)}
            ${mkTd(escapeHtml(r.credit ?? ""), `${tdBand}${amtAlign}`)}
          </tr>`;
    })
    .join("");
}

function purchaseItemLabel(item) {
  const p = item?.product;
  if (p && typeof p === "object") return String(p.productName || "").trim() || "—";
  return "—";
}

function dedupeVouchersById(list) {
  const seen = new Set();
  return (list || []).filter((v) => {
    const id = v?._id != null ? String(v._id) : "";
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

const VIEW_MODES = [
  { id: "normal", label: "Normal" },
  { id: "ledger", label: "Ledger" },
  { id: "statement", label: "Statement" },
];

const AccountIndex = () => {
  const queryClient = useQueryClient();

  const { renderRowCell: baseCell } = useTableData();
  const [viewMode, setViewMode] = useState("normal");
  const [partySearch, setPartySearch] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("");
  const [activityValueInput, setActivityValueInput] = useState("3");
  const [activityUnit, setActivityUnit] = useState("months");

  const columnsByView = useMemo(() => {
    if (viewMode === "ledger") {
      return [
        "Party Name",
        "Account Type",
        "Credit (₹)",
        "Debit (₹)",
        "Actions",
      ];
    }
    if (viewMode === "statement") {
      return [
        "Party Name",
        "Street",
        "City",
        "State",
        "PIN",
        "Party Type",
        "Transport",
        "Delivery At",
        "Credit (₹)",
        "Debit (₹)",
        "Status",
        "Actions",
      ];
    }
    return [
      "Party Name",
      "Contact Person",
      "Territory",
      "Account Type",
      "Credit (₹)",
      "Debit (₹)",
      "Status",
      "Actions",
    ];
  }, [viewMode]);

  const navigate = useNavigate();
  const [isAddAccOpen, setIsAddAccOpen] = useState(false);
  const [editAccountId, setEditAccountId] = useState(null);
  const [statementPdfRow, setStatementPdfRow] = useState(null);

  const { data: activitySettings } = useQuery({
    queryKey: ["customerActivitySettings"],
    queryFn: async () => {
      const { data } = await customersApi.getActivitySettings();
      return data;
    },
    enabled: isAdminUser(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (activitySettings && typeof activitySettings.value === "number") {
      setActivityValueInput(String(activitySettings.value));
      setActivityUnit(
        activitySettings.unit === "days" ? "days" : "months"
      );
    }
  }, [activitySettings]);

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["accounts", "table"],
    queryFn: async () => {
      try {
        const res = await accountsApi.getAll({});
        const raw = res?.data;
        const list = Array.isArray(raw)
          ? raw
          : raw && typeof raw === "object" && Array.isArray(raw.data)
            ? raw.data
            : [];
        return list.map(mapAccountToRow);
      } catch (e) {
        if (isEmptyListNotFound(e)) return [];
        throw e;
      }
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(getApiErrorMessage(error, "Could not load accounts"));
    }
  }, [isError, error]);

  const accountTypeOptions = useMemo(() => {
    const seen = new Set();
    rows.forEach((r) => {
      const t = String(r["Account Type"] ?? "").trim();
      if (t && t !== "—") seen.add(t);
    });
    return [...seen].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = rows;
    const q = partySearch.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        String(r["Party Name"] ?? "")
          .toLowerCase()
          .includes(q)
      );
    }
    if (accountTypeFilter) {
      list = list.filter(
        (r) => String(r["Account Type"] ?? "") === accountTypeFilter
      );
    }
    return list;
  }, [rows, partySearch, accountTypeFilter]);

  const fmtInr = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const renderAccountTableFooter = useCallback(
    (displayedRows = []) => {
      if (!displayedRows.length) return null;
      let credit = 0;
      let debit = 0;
      displayedRows.forEach((row) => {
        credit += parseInrCell(row["Credit (₹)"]);
        debit += parseInrCell(row["Debit (₹)"]);
      });
      return (
        <tfoot className="sticky bottom-0 z-[1] border-t-2 border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-800/95">
          <tr>
            {columnsByView.map((col) => {
              if (col === "Account Type") {
                return (
                  <td key={col} className={`${tableFooterTdClasses(col)} text-right`}>
                    Total
                  </td>
                );
              }
              if (col === "Credit (₹)") {
                return (
                  <td key={col} className={tableFooterTdClasses(col)}>
                    {fmtInr(credit)}
                  </td>
                );
              }
              if (col === "Debit (₹)") {
                return (
                  <td key={col} className={tableFooterTdClasses(col)}>
                    {fmtInr(debit)}
                  </td>
                );
              }
              return <td key={col} className={tableFooterTdClasses(col)} />;
            })}
          </tr>
        </tfoot>
      );
    },
    [columnsByView]
  );

  const handleView = (row) => {
    navigate("/dashboard/account/ledger", { state: { accountId: row._id } });
  };
  const handleEdit = (row) => {
    setIsAddAccOpen(false);
    const id = row._id ?? row.id;
    setEditAccountId(id != null ? String(id) : null);
  };
  const handleStatementPdf = async (row, variant) => {
    try {
      const accountId = row?._id ? String(row._id) : "";
      if (!accountId) {
        toast.error("Account id not found.");
        return;
      }

      const isDetail = variant === "detail";

      const [
        { data: accountData },
        { data: paymentsRes },
        { data: receiptsRes },
        { data: journalsRes },
        { data: purchaseRes },
        { data: purchaseReturnRes },
        { data: expenseRes },
        { data: cashRes },
      ] = await Promise.all([
        accountsApi.getById(accountId),
        paymentVouchersApi.getAll({}),
        receiptVouchersApi.getAll({}),
        journalVouchersApi.getAll({}),
        purchaseVouchersApi.getAll({}),
        purchaseReturnVouchersApi.getAll({}),
        expenseVouchersApi.getAll({}),
        cashVouchersApi.getAll({}),
      ]);

      let ledgerSource = {
        payments: normalizeList(paymentsRes),
        receipts: normalizeList(receiptsRes),
        journals: normalizeList(journalsRes),
        purchases: normalizeList(purchaseRes),
        purchaseReturns: normalizeList(purchaseReturnRes),
        expenses: normalizeList(expenseRes),
        cashVouchers: normalizeList(cashRes),
      };

      if (isDetail) {
        const accountEarly = accountData || row?._raw || {};
        const partyNameEarly = String(
          accountEarly.businessName || row["Party Name"] || ""
        ).trim();
        const contactEarly = String(
          accountEarly.name || row["Contact Person"] || ""
        ).trim();
        const mA = partyNameEarly.toLowerCase();
        const mB = contactEarly.toLowerCase();
        const matchParty = (pn) => {
          const x = String(pn || "").trim().toLowerCase();
          return x && (x === mA || x === mB);
        };
        const purchaseMatchedSummaries = dedupeVouchersById(
          ledgerSource.purchases.filter((v) => matchParty(v.partyName))
        );
        const purchaseReturnMatchedSummaries = dedupeVouchersById(
          ledgerSource.purchaseReturns.filter((v) => matchParty(v.partyName))
        );

        const purchaseVouchersFull = (
          await Promise.all(
            purchaseMatchedSummaries.map((v) =>
              purchaseVouchersApi
                .getById(String(v._id))
                .then((r) => r.data)
                .catch(() => null)
            )
          )
        ).filter(Boolean);
        const purchaseReturnVouchersFull = (
          await Promise.all(
            purchaseReturnMatchedSummaries.map((v) =>
              purchaseReturnVouchersApi
                .getById(String(v._id))
                .then((r) => r.data)
                .catch(() => null)
            )
          )
        ).filter(Boolean);

        ledgerSource = {
          ...ledgerSource,
          purchases: dedupeVouchersById(purchaseVouchersFull),
          purchaseReturns: dedupeVouchersById(purchaseReturnVouchersFull),
        };
      }

      const account = accountData || row?._raw || {};
      const partyName = String(account.businessName || row["Party Name"] || "").trim();

      const entries = buildPartyTransactionEntries(account, accountId, ledgerSource);
      const tx = entries.map((e) => ({
        kind: e.kind,
        raw: e.raw,
        date: e.date,
        particulars: e.particulars,
        voucherType: e.voucherType,
        voucherNo: e.voucherNo,
        debit: e.debit,
        credit: e.credit,
      }));

      const { openingAmount, openingIsDebit } = accountOpeningMeta(account);
      const openingDate =
        account.createdAt || account.updatedAt || new Date().toISOString();

      let running = openingAmount
        ? openingIsDebit
          ? openingAmount
          : -openingAmount
        : 0;

      const openingDebitStr =
        openingIsDebit && openingAmount
          ? fmtRupee(openingAmount).replace("₹", "")
          : "";
      const openingCreditStr =
        !openingIsDebit && openingAmount
          ? fmtRupee(openingAmount).replace("₹", "")
          : "";

      const companyName = "JETOX AGRO INDUSTRIES";
      const companyAddr =
        "A-16, Swagat Industrial Park, Dhamatvan Road, Bakrol, Ahmedabad, Gujarat - 382433.";
      const companyMeta = "GSTIN - 24BBCPV7183D1ZJ";
      const companyPhone = "9978532727";
      const partyAddress = String(account.address || "").trim();
      const partyGst = String(account.gstNumber || row.GST || "").trim();
      const partyPhone = String(account.mobileNumber || "").trim();

      const txDates = tx
        .map((e) => new Date(e.date || 0).getTime())
        .filter((n) => Number.isFinite(n) && n > 0);
      const fromTs = txDates.length
        ? Math.min(...txDates)
        : new Date(openingDate).getTime();
      const toTs = txDates.length ? Math.max(...txDates) : fromTs;
      const fromText = formatStatementDate(fromTs);
      const toText = formatStatementDate(toTs);

      let rowsHtml = "";
      let tableStyle = "width:100%;border-collapse:collapse;font-size:12px";
      let thStyle = "";
      if (isDetail) {
        tableStyle =
          "width:100%;border-collapse:collapse;font-size:12px;border:1px solid #bbb";
        thStyle =
          "border:1px solid #bbb;padding:5px 4px;background:#eee;font-weight:600";
      }

      if (!isDetail) {
        const printableRows = [];
        printableRows.push({
          date: formatStatementDate(openingDate) || "—",
          particulars: "Opening Balance",
          voucherType: "",
          voucherNo: "",
          debit: openingDebitStr,
          credit: openingCreditStr,
        });

        tx.forEach((e) => {
          running += e.debit - e.credit;
          printableRows.push({
            date: formatStatementDate(e.date) || "—",
            particulars: e.particulars || "—",
            voucherType: e.voucherType || "—",
            voucherNo: e.voucherNo || "—",
            debit: e.debit ? fmtRupee(e.debit).replace("₹", "") : "",
            credit: e.credit ? fmtRupee(e.credit).replace("₹", "") : "",
          });
        });

        printableRows.push({
          date: "",
          particulars: "Closing Balance",
          voucherType: "",
          voucherNo: "",
          debit:
            running >= 0 ? fmtRupee(Math.abs(running)).replace("₹", "") : "",
          credit:
            running < 0 ? fmtRupee(Math.abs(running)).replace("₹", "") : "",
        });

        rowsHtml = buildStatementTableRowsHtml(printableRows);
      } else {
        const detailRows = [];
        detailRows.push({
          date: formatStatementDate(openingDate) || "—",
          particulars: "Opening Balance",
          voucherType: "",
          voucherNo: "",
          debit: openingDebitStr,
          credit: openingCreditStr,
        });

        let runningDetail = running;

        for (const e of tx) {
          runningDetail += e.debit - e.credit;
          const dateStr = formatStatementDate(e.date) || "—";
          const dStr = e.debit ? fmtStatementCellAmount(e.debit) : "";
          const cStr = e.credit ? fmtStatementCellAmount(e.credit) : "";

          if (
            e.kind === "payment" ||
            e.kind === "receipt" ||
            e.kind === "journal" ||
            e.kind === "expense" ||
            e.kind === "cash"
          ) {
            detailRows.push({
              date: dateStr,
              particulars: e.particulars || "—",
              voucherType: e.voucherType || "—",
              voucherNo: e.voucherNo || "—",
              debit: dStr,
              credit: cStr,
            });
            continue;
          }

          if (e.kind === "purchase") {
            const pv = e.raw;
            const gst = Number(pv.gstAmount) || 0;
            const half = gst / 2;
            const items = pv.items || [];

            detailRows.push({
              date: dateStr,
              particulars: "Purchase",
              voucherType: "Purchase",
              voucherNo: String(pv.voucherNo || "—"),
              debit: "",
              credit: cStr,
            });

            if (items.length > 0) {
              for (const item of items) {
                const name = purchaseItemLabel(item);
                const qty = Number(item.quantity) || 0;
                const rate = Number(item.rateParUnit) || 0;
                const sub = Number(item.subtotal);
                const lineSub = Number.isFinite(sub) ? sub : qty * rate;
                const unit = String(item.unit || "Kg").trim() || "Kg";
                const rateTxt = `${rate.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}/${unit}`;
                detailRows.push({
                  date: "",
                  plainParticulars: true,
                  particulars: name,
                  voucherType: `${qty.toLocaleString("en-IN")} ${unit}`,
                  voucherNo: rateTxt,
                  numericDetailColumns: true,
                  debit: "",
                  credit: fmtStatementDetailTwoDecimals(lineSub),
                  detailBandBg: true,
                });
              }
              if (gst > 0) {
                detailRows.push({
                  date: "",
                  plainParticulars: true,
                  particulars: "CGST",
                  voucherType: "",
                  voucherNo: "",
                  debit: "",
                  credit: fmtStatementDetailTwoDecimals(half),
                  detailBandBg: true,
                });
                detailRows.push({
                  date: "",
                  plainParticulars: true,
                  particulars: "SGST",
                  voucherType: "",
                  voucherNo: "",
                  debit: "",
                  credit: fmtStatementDetailTwoDecimals(gst - half),
                  detailBandBg: true,
                });
              }
            }
            continue;
          }

          if (e.kind === "purchaseReturn") {
            const pv = e.raw;
            const gst = Number(pv.gstAmount) || 0;
            const half = gst / 2;
            const items = pv.items || [];

            detailRows.push({
              date: dateStr,
              particulars: "Purchase Return",
              voucherType: "Purchase Return",
              voucherNo: String(pv.voucherNo || "—"),
              debit: dStr,
              credit: "",
            });

            if (items.length > 0) {
              for (const item of items) {
                const name = purchaseItemLabel(item);
                const qty = Number(item.quantity) || 0;
                const rate = Number(item.rateParUnit) || 0;
                const sub = Number(item.subtotal);
                const lineSub = Number.isFinite(sub) ? sub : qty * rate;
                const unit = String(item.unit || "Kg").trim() || "Kg";
                const rateTxt = `${rate.toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}/${unit}`;
                detailRows.push({
                  date: "",
                  plainParticulars: true,
                  particulars: name,
                  voucherType: `${qty.toLocaleString("en-IN")} ${unit}`,
                  voucherNo: rateTxt,
                  numericDetailColumns: true,
                  debit: fmtStatementDetailTwoDecimals(lineSub),
                  credit: "",
                  detailBandBg: true,
                });
              }
              if (gst > 0) {
                detailRows.push({
                  date: "",
                  plainParticulars: true,
                  particulars: "CGST",
                  voucherType: "",
                  voucherNo: "",
                  debit: fmtStatementDetailTwoDecimals(half),
                  credit: "",
                  detailBandBg: true,
                });
                detailRows.push({
                  date: "",
                  plainParticulars: true,
                  particulars: "SGST",
                  voucherType: "",
                  voucherNo: "",
                  debit: fmtStatementDetailTwoDecimals(gst - half),
                  credit: "",
                  detailBandBg: true,
                });
              }
            }
          }
        }

        detailRows.push({
          date: "",
          particulars: "Closing Balance",
          voucherType: "",
          voucherNo: "",
          debit:
            runningDetail >= 0
              ? fmtRupee(Math.abs(runningDetail)).replace("₹", "")
              : "",
          credit:
            runningDetail < 0
              ? fmtRupee(Math.abs(runningDetail)).replace("₹", "")
              : "",
        });

        rowsHtml = buildStatementTableRowsHtml(detailRows, { bordered: true });
      }

      const bodyHtml = `
        <div style="text-align:center;margin-bottom:10px">
          <div style="font-size:24px;font-weight:800;letter-spacing:.5px">${escapeHtml(companyName)}</div>
          <div style="font-size:12px">${escapeHtml(companyAddr)}</div>
          <div style="font-size:12px">${escapeHtml(companyMeta)}, Mo. ${escapeHtml(companyPhone)}</div>
          <div style="font-size:15px;margin-top:5px">Account Statement For</div>
          <div style="font-size:20px;font-weight:700">${escapeHtml(partyName || "—")}</div>
          ${
            partyAddress
              ? `<div style="font-size:11px;max-width:620px;margin:0 auto;line-height:1.35;white-space:normal;word-break:break-word">${escapeHtml(partyAddress).replace(/\n/g, "<br/>")}</div>`
              : ""
          }
          <div style="font-size:11px">${
            partyGst ? `GSTIN - ${escapeHtml(partyGst)}` : ""
          } ${partyPhone ? `, Mo. ${escapeHtml(partyPhone)}` : ""}</div>
          <div style="font-size:14px;margin-top:5px">From ${escapeHtml(fromText)} to ${escapeHtml(toText)}</div>
        </div>
        <table style="${tableStyle}">
          <thead>
            <tr>
              <th style="width:10%;text-align:left;${thStyle}">Date</th>
              <th style="width:38%;text-align:left;${thStyle}">Particulars</th>
              <th style="width:12%;text-align:center;white-space:nowrap;${thStyle}">Voucher Type</th>
              <th style="width:12%;text-align:center;white-space:nowrap;${thStyle}">Voucher No.</th>
              <th style="width:14%;text-align:right;${thStyle}">Debit</th>
              <th style="width:14%;text-align:right;${thStyle}">Credit</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      `;

      const title = `Statement — ${partyName || "Account"}`;
      const fullHtml = buildStandalonePrintableHtml(title, bodyHtml, {
        bodyPaddingPx: 10,
        bodyFontSizePx: 11,
        h1FontSizePx: 1,
        tableCellPaddingPx: isDetail ? 3 : 4,
        showTitle: false,
      });

      const fileName = isDetail ? `${title} — Details.pdf` : `${title}.pdf`;
      await downloadHtmlDocumentAsPdf(fullHtml, fileName);
      toast.success("PDF downloaded successfully.");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("PDF generation failed. Please try again.");
    }
  };

  const renderRowCell = (key, value, row) => {
    if (key === "Street") {
      return (
        <td key={key} className={`${tableTdClasses(key)} max-w-[14rem]`}>
          <span
            title={row._fullAddress || value}
            className="truncate inline-block max-w-full align-middle text-gray-800 dark:text-slate-200"
          >
            {value || "—"}
          </span>
        </td>
      );
    }
    if (key === "Status") {
      const s = String(value || "");
      const isInactive =
        s.toLowerCase().includes("inactive") || s.includes("auto");
      return (
        <td
          key={key}
          className={`${tableTdClasses(key)} whitespace-nowrap`}
        >
          <span
            className={`inline-flex max-w-full items-center rounded-md border px-2 py-1 text-sm font-medium leading-tight ${
              isInactive
                ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/80 dark:bg-rose-950 dark:text-rose-50"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-600/80 dark:bg-emerald-950 dark:text-emerald-50"
            }`}
          >
            {value || "—"}
          </span>
        </td>
      );
    }
    return baseCell(key, value, row);
  };

  const persistCustomerActivitySetting = async () => {
    const n = Number(String(activityValueInput).replace(/\D/g, "") || "3");
    const v = Number.isFinite(n) && n > 0 ? n : 3;
    const unit = activityUnit === "days" ? "days" : "months";
    try {
      await customersApi.patchActivitySettings({ value: v, unit });
      setActivityValueInput(String(v));
      setActivityUnit(unit);
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      await queryClient.invalidateQueries({
        queryKey: ["customerStatusSummary"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["customerActivitySettings"],
      });
      toast.success(
        `Customer activity window: ${v} ${unit === "days" ? "day(s)" : "month(s)"}`
      );
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not save setting"));
    }
  };

  const renderAccountActions = (row) => (
    <td className={tableTdClasses("Actions")}>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          title="View ledger"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            handleView(row);
          }}
        >
          <Eye size={18} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          title="Edit account"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(row);
          }}
        >
          <PenLine size={18} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          title="Statement / print"
          className={TABLE_ACTION_ICON_BTN}
          onClick={(e) => {
            e.stopPropagation();
            setStatementPdfRow(row);
          }}
        >
          <FileText size={18} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </td>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-3 2xl:gap-4">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="flex h-10 w-full justify-center rounded-lg border border-light-border bg-rowBg p-1 sm:w-auto sm:justify-start sm:mr-auto dark:border-slate-700 dark:bg-slate-800/50">
              {VIEW_MODES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id)}
                  className={`flex min-h-0 flex-1 items-center justify-center rounded-md px-2.5 text-sm font-medium sm:flex-none sm:px-3.5 ${
                    viewMode === v.id
                      ? "bg-primary text-white shadow-sm dark:bg-primary dark:text-white"
                      : "text-slate-600 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-slate-800/90"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:min-w-0 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
              <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
                <div className="relative w-full min-w-0 sm:max-w-[13rem] sm:shrink-0">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <input
                    type="search"
                    enterKeyHint="search"
                    placeholder="Search party name…"
                    aria-label="Search party name"
                    className="h-10 w-full min-w-0 rounded-lg border border-light-border bg-white py-0 pl-8 pr-2.5 text-sm text-dark placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    value={partySearch}
                    onChange={(e) => setPartySearch(e.target.value)}
                  />
                </div>
                <select
                  aria-label="Filter by account type"
                  className="h-10 w-full min-w-0 shrink-0 rounded-lg border border-light-border bg-white px-3 text-sm text-dark sm:w-auto sm:min-w-[10.5rem] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  value={accountTypeFilter}
                  onChange={(e) => setAccountTypeFilter(e.target.value)}
                >
                  <option value="">All account types</option>
                  {accountTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {isAdminUser() && (
              <div className="flex h-10 w-full min-w-0 shrink-0 items-center justify-between gap-2 rounded-lg border border-light-border bg-white px-2.5 text-sm text-light sm:w-auto sm:justify-start sm:gap-2.5 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <span className="whitespace-nowrap font-medium text-dark/90 dark:text-slate-200">
                  Customer activity
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={activityUnit === "days" ? 3660 : 120}
                  title="Customer Activity Timeframe"
                  className="h-8 w-[3.75rem] rounded border border-light-border px-1.5 text-sm tabular-nums text-dark dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={activityValueInput}
                  onChange={(e) => setActivityValueInput(e.target.value)}
                  onBlur={persistCustomerActivitySetting}
                />
                <select
                  className="h-8 min-w-[5.25rem] rounded border border-light-border bg-white px-2 py-0 text-sm text-dark dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={activityUnit}
                  onChange={async (e) => {
                    const next = e.target.value === "days" ? "days" : "months";
                    setActivityUnit(next);
                    const n = Number(
                      String(activityValueInput).replace(/\D/g, "") || "3"
                    );
                    const v = Number.isFinite(n) && n > 0 ? n : 3;
                    try {
                      await customersApi.patchActivitySettings({
                        value: v,
                        unit: next,
                      });
                      await queryClient.invalidateQueries({
                        queryKey: ["accounts"],
                      });
                      await queryClient.invalidateQueries({
                        queryKey: ["customerStatusSummary"],
                      });
                      toast.success(
                        `Customer activity window: ${v} ${next === "days" ? "day(s)" : "month(s)"}`
                      );
                    } catch (err) {
                      toast.error(
                        getApiErrorMessage(err, "Could not save setting")
                      );
                    }
                  }}
                >
                  <option value="months">months</option>
                  <option value="days">days</option>
                </select>
                </div>
              </div>
              )}

              <Button
                type="button"
                label="Add account"
                {...mergePageAddButton({
                  className:
                    "w-full shrink-0 !h-10 !min-h-10 !max-h-10 !py-0 !px-4 justify-center gap-1.5 !text-sm font-semibold sm:w-auto [&_svg]:!h-[17px] [&_svg]:!w-[17px]",
                })}
                onClick={() => {
                  setEditAccountId(null);
                  setIsAddAccOpen(true);
                }}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-light text-sm dark:text-slate-400">
            Loading accounts…
          </div>
        ) : (
          <DataTable
            columns={columnsByView}
            data={filteredRows}
            renderAction={renderAccountActions}
            renderRowCell={renderRowCell}
            maxHeight="calc(100vh - 12rem)"
            renderFooter={
              filteredRows.length ? renderAccountTableFooter : undefined
            }
          />
        )}

        <CommonModal
          open={Boolean(statementPdfRow)}
          onClose={() => setStatementPdfRow(null)}
          title="Download statement"
          size="sm"
          footer={
            <div className="flex w-full flex-wrap justify-center gap-2">
              <Button
                type="button"
                label="Normal view PDF"
                onClick={async () => {
                  const r = statementPdfRow;
                  setStatementPdfRow(null);
                  if (r) await handleStatementPdf(r, "normal");
                }}
              />
              <Button
                type="button"
                label="Details view PDF"
                onClick={async () => {
                  const r = statementPdfRow;
                  setStatementPdfRow(null);
                  if (r) await handleStatementPdf(r, "detail");
                }}
              />
            </div>
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose normal (summary lines) or details (expanded lines, purchase
            invoices, and turnover totals).
          </p>
        </CommonModal>

        <CreateAccountModal
          open={isAddAccOpen || Boolean(editAccountId)}
          accountId={editAccountId}
          onClose={() => {
            setIsAddAccOpen(false);
            setEditAccountId(null);
          }}
          onSaved={() =>
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
          }
        />
      </div>
    </DashboardLayout>
  );
};

export default AccountIndex;
