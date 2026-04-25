import fs from "fs";
import path from "path";
import moment from "moment";

export function ensureHrmUploadDir(): string {
  const dir = path.join(process.cwd(), "uploads", "hrm");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Returns public URL path e.g. /uploads/hrm/file.html */
export function writeHrmHtmlFile(prefix: string, html: string): string {
  const dir = ensureHrmUploadDir();
  const fname = `${prefix}-${Date.now()}.html`;
  fs.writeFileSync(path.join(dir, fname), html, "utf8");
  return `/uploads/hrm/${fname}`;
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOfferLetterHtml(params: {
  candidateName: string;
  position: string;
  salary: number;
  joiningDate: Date;
  companyName: string;
  companyAddress?: string;
}): string {
  const d = moment(params.joiningDate).format("DD MMMM YYYY");
  const addr = params.companyAddress
    ? `<p style="margin:4px 0;color:#444">${esc(params.companyAddress)}</p>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Offer Letter</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:24px auto;padding:24px;line-height:1.6;color:#111}
h1{color:#0f766e;font-size:22px}.sig{margin-top:48px}</style></head><body>
<p><strong>${esc(params.companyName)}</strong></p>${addr}
<p style="text-align:right">${moment().format("DD MMMM YYYY")}</p>
<p>Dear <strong>${esc(params.candidateName)}</strong>,</p>
<p>We are pleased to offer you the position of <strong>${esc(
    params.position
  )}</strong> with our organization, on the following terms:</p>
<ul>
<li><strong>Compensation:</strong> ₹${params.salary.toLocaleString(
    "en-IN"
  )} per month (gross), subject to statutory deductions as applicable.</li>
<li><strong>Date of joining:</strong> ${esc(d)}</li>
<li>This offer is subject to satisfactory background verification and acceptance of company policies.</li>
</ul>
<p>Please confirm your acceptance by signing and returning a copy of this letter.</p>
<p class="sig">Yours sincerely,<br/><br/><strong>Human Resources</strong><br/>${esc(
    params.companyName
  )}</p>
</body></html>`;
}

export function buildAppointmentLetterHtml(params: {
  employeeName: string;
  position: string;
  department: string;
  joiningDate: Date;
  companyName: string;
  companyAddress?: string;
}): string {
  const d = moment(params.joiningDate).format("DD MMMM YYYY");
  const addr = params.companyAddress
    ? `<p style="margin:4px 0;color:#444">${esc(params.companyAddress)}</p>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Appointment Letter</title>
<style>body{font-family:Georgia,serif;max-width:720px;margin:24px auto;padding:24px;line-height:1.6;color:#111}
h1{color:#0f766e;font-size:22px}.sig{margin-top:48px}</style></head><body>
<p><strong>${esc(params.companyName)}</strong></p>${addr}
<p style="text-align:right">${moment().format("DD MMMM YYYY")}</p>
<p>Dear <strong>${esc(params.employeeName)}</strong>,</p>
<p>With reference to your application and subsequent selection process, we are pleased to appoint you as <strong>${esc(
    params.position
  )}</strong> in the <strong>${esc(
    params.department
  )}</strong> department, effective <strong>${esc(d)}</strong>.</p>
<p>Your compensation, working hours, leave policy, and conduct rules shall be as per the employee handbook and applicable policies of the company.</p>
<p>This appointment may be terminated by either party with notice as per company policy and applicable law.</p>
<p>We welcome you to the team and look forward to a mutually rewarding association.</p>
<p class="sig">Yours sincerely,<br/><br/><strong>Authorized Signatory</strong><br/>${esc(
    params.companyName
  )}</p>
</body></html>`;
}

export function buildSalarySlipHtml(params: {
  employeeName: string;
  department: string;
  yearMonth: string;
  basic: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
}): string {
  const rows = (
    items: { name: string; amount: number }[],
    label: string
  ) =>
    items
      .map(
        (x) =>
          `<tr><td>${esc(x.name)}</td><td style="text-align:right">₹${x.amount.toLocaleString(
            "en-IN"
          )}</td></tr>`
      )
      .join("") ||
    `<tr><td colspan="2" style="color:#888">—</td></tr>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Salary Slip</title>
<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:24px auto;padding:16px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}h1{color:#0f766e;font-size:18px}</style></head><body>
<h1>Salary slip — ${esc(params.yearMonth)}</h1>
<p><strong>${esc(params.employeeName)}</strong> · ${esc(
    params.department
  )}</p>
<table>
<tr><th colspan="2">Earnings</th></tr>
<tr><td>Basic</td><td style="text-align:right">₹${params.basic.toLocaleString(
    "en-IN"
  )}</td></tr>
${rows(params.allowances, "Allowances")}
<tr><td><strong>Gross</strong></td><td style="text-align:right"><strong>₹${params.grossSalary.toLocaleString(
    "en-IN"
  )}</strong></td></tr>
<tr><th colspan="2">Deductions</th></tr>
${rows(params.deductions, "Deductions")}
<tr><td><strong>Total deductions</strong></td><td style="text-align:right">₹${params.totalDeductions.toLocaleString(
    "en-IN"
  )}</td></tr>
<tr><td><strong>Net salary</strong></td><td style="text-align:right"><strong>₹${params.netSalary.toLocaleString(
    "en-IN"
  )}</strong></td></tr>
</table>
</body></html>`;
}
