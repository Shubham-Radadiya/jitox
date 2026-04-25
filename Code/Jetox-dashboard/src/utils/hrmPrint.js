import { escapeHtml } from "./printAndExport";

export function formatInr(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `₹${x.toLocaleString("en-IN")}`;
}

/** Build inner HTML for salary slip print (matches server template). */
export function buildSalarySlipBody(slip) {
  const emp = slip.employeeId;
  const name = emp?.name || "Employee";
  const dept = emp?.department || "—";
  const ym = slip.yearMonth || "—";
  const row = (label, val) =>
    `<tr><td>${escapeHtml(label)}</td><td style="text-align:right">${val}</td></tr>`;
  const rows = (items, emptyLabel) =>
    (items || []).length
      ? (items || [])
          .map((x) => row(x.name, formatInr(x.amount)))
          .join("")
      : `<tr><td colspan="2" style="color:#888">—</td></tr>`;
  return `
<p><strong>${escapeHtml(name)}</strong> · ${escapeHtml(dept)}</p>
<table>
<tr><th colspan="2">Earnings</th></tr>
${row("Basic", formatInr(slip.basic))}
${rows(slip.allowances)}
<tr><td><strong>Gross</strong></td><td style="text-align:right"><strong>${formatInr(slip.grossSalary)}</strong></td></tr>
<tr><th colspan="2">Deductions</th></tr>
${rows(slip.deductions)}
<tr><td><strong>Total deductions</strong></td><td style="text-align:right">${formatInr(slip.totalDeductions)}</td></tr>
<tr><td><strong>Net salary</strong></td><td style="text-align:right"><strong>${formatInr(slip.netSalary)}</strong></td></tr>
</table>
<p style="font-size:12px;color:#666">Period: ${escapeHtml(ym)}</p>`;
}
