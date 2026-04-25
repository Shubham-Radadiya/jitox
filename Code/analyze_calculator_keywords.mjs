import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = __dirname;

const MARKERS = [
  "Home Loan EMI Calculator",
  "Car Loan EMI Calculator",
  "Personal Loan EMI Calculator",
  "Education Loan EMI Calculator",
];

const KEYWORDS_RAW = {
  "EMI Calculator": `emi calculator
loan calculator
loan emi calculator
loan interest calculator
emi calculator online
monthly emi calculator
emi calculator app
emi interest calculator
bank loan interest calculator
online loan calculator
bank loan calculator
loan amount calculator
bank emi calculator
bank calculator
emi interest rate calculator
installment calculator
loan percentage calculator
loan interest rate calculator
term loan emi calculator
easy emi calculator
bank loan emi calculator
loan emi calculator online
loan repayment calculator
emi schedule calculator
installment loan calculator
best emi calculator
how to calculate emi
loan emi calculator app
finance emi calculator
emi converter
emi repayment calculator
calculate loan amount from emi
loan emi calculator monthly
emi calculator formula
emi principal and interest calculator
emi calculator per month
emi percentage calculator
monthly loan calculator
how to calculate interest on a loan
loan interest calculator online
6 month emi calculator
half yearly emi calculator
emi formula
yearly emi calculator
emi and interest calculator
emi calculator formula
emi monthly interest calculator
emi amount calculator
how to calculate loan emi
loan calculator formula
monthly installment calculator
emi table
emi payment calculator
check emi calculator
emi repayment schedule
finance interest calculator
principal and interest loan calculator
loan rate calculator
emi loan calculator online
easy emi loan calculator
calculate monthly interest on loan
calculate my emi
loan calculator per month
loan and emi calculator
simple loan calculator
detailed emi calculator
bank emi interest calculator
emi calculation calculator
loan premium calculator
emi calculator tool`.split("\n"),
  "Home Loan EMI Calculator": `home loan emi calculator
home loan calculator
housing loan emi calculator
home emi calculator
home loan interest calculator
house loan calculator
house loan emi
how to calculate home loan emi
bank housing loan calculator
house emi calculator
house loan calculator online
home loan emi calculator online
bank home loan calculator
home loan monthly payment calculator
bank emi calculator for home loan
housing loan interest rate calculator
home loan rate calculator
how to calculate emi for housing loan
home loan formula
home loan emi calculator formula
home loan interest emi calculator
how to calculate home loan
home loan amount calculator
how home loan is calculated
home loan emi calculator formula
how to calculate house loan
house finance calculator`.split("\n"),
  "Car Loan EMI Calculator": `car loan emi calculator
car emi calculator
car loan calculator
car loan interest calculator
car loan interest rate
car loan emi
car loan interest rate calculator
vehicle loan emi calculator
vehicle loan calculator
car finance calculator
used car loan emi calculator
vehicle emi calculator
second hand car loan emi calculator
auto loan emi calculator
car emi calculator online
vehicle loan interest calculator
car loan repayment calculator
new car emi calculator
used car loan calculator
used car emi calculator
auto loan calculator
car installment calculator
new car loan emi calculator
car payment calculator
four wheeler emi calculator
car loan emi calculator online
refinance car loan calculator
car interest rate calculator
online car loan calculator
new car loan calculator
auto emi calculator
vehicle loan emi
how to calculate car loan emi
vehicle finance calculator
car loan installment calculator
4 wheeler loan calculator
auto loan amortization calculator
four wheeler loan emi calculator
car loan finance calculator
how to calculate car loan interest
how to calculate car loan emi
how to calculate car loan interest
auto loan amount calculator
car loan amount calculator
emi calculation formula car loan
vehicle interest calculator
commercial vehicle loan emi calculator
commercial vehicle loan calculator
how to calculate emi for car
bank car loan interest rates`.split("\n"),
  "Personal Loan EMI Calculator": `personal loan emi calculator
personal loan calculator
pl calculator
pl emi calculator
personal loan emi
pl loan calculator
personal emi calculator
personal loan interest calculator
personal loan interest
personal loan emi calculator online
online personal loan emi calculator
personal loan interest
pl interest calculator
online personal loan calculator
bank personal loan emi calculator
personal loan emi calculator month wise
how to calculate emi for personal loan
how to calculate personal loan interest
personal loan amount calculator
how to calculate emi for personal loan
bank personal loan calculator
personal loan monthly emi calculator
personal loan calculator with amortization schedule
personal loan emi interest rates
personal loan emi calculator formula`.split("\n"),
  "Education Loan EMI Calculator": `education loan emi calculator
student loan emi calculator
education loan calculator
student loan calculator
education loan interest rate calculator
education loan interest calculator
education loan repayment calculator
student loan repayment calculator
education loan emi
study loan calculator
student loan interest calculator
study loan emi calculator
abroad education loan emi calculator
student loan interest rate calculator
education emi calculator
education loan tenure
how to calculate education loan interest
how much interest on education loan
how much is student loan interest
education loan tenure`.split("\n"),
};

function loadFullText() {
  const p = join(BASE, "calculator_guides.txt");
  if (!existsSync(p)) throw new Error(`Missing ${p}`);
  return readFileSync(p, "utf8");
}

function splitSections(full) {
  const positions = MARKERS.map((m) => [m, full.indexOf(m)]);
  for (const [m, pos] of positions) {
    if (pos < 0) throw new Error(`Marker not found: ${m}`);
  }
  const i0 = positions[0][1];
  return {
    "EMI Calculator": full.slice(0, i0),
    "Home Loan EMI Calculator": full.slice(positions[0][1], positions[1][1]),
    "Car Loan EMI Calculator": full.slice(positions[1][1], positions[2][1]),
    "Personal Loan EMI Calculator": full.slice(positions[2][1], positions[3][1]),
    "Education Loan EMI Calculator": full.slice(positions[3][1]),
  };
}

function uniquePreserveOrder(items) {
  const seen = new Set();
  const out = [];
  for (const x of items) {
    const k = x.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function analyze(text, keywords) {
  const kws = uniquePreserveOrder(keywords);
  const hay = text.toLowerCase();
  const found = [];
  const missing = [];
  for (const kw of kws) {
    if (hay.includes(kw.toLowerCase())) found.push(kw);
    else missing.push(kw);
  }
  return { found: found.length, total: kws.length, missing };
}

let full = loadFullText();
const cut = full.indexOf("this is text content");
if (cut !== -1) full = full.slice(0, cut);
const sections = splitSections(full);

const order = [
  "EMI Calculator",
  "Home Loan EMI Calculator",
  "Car Loan EMI Calculator",
  "Personal Loan EMI Calculator",
  "Education Loan EMI Calculator",
];

console.log("Keyword coverage (case-insensitive substring match)\n");
let grandF = 0;
let grandT = 0;
for (const name of order) {
  const { found, total, missing } = analyze(sections[name], KEYWORDS_RAW[name]);
  grandF += found;
  grandT += total;
  const pct = total ? ((100 * found) / total).toFixed(1) : "0.0";
  console.log(`## ${name}`);
  console.log(`Found: ${found} / ${total} unique keywords  →  ${pct}%`);
  if (missing.length) {
    console.log("Missing:");
    for (const m of missing) console.log(`  - ${m}`);
  }
  console.log("");
}
const gpct = grandT ? ((100 * grandF) / grandT).toFixed(1) : "0.0";
console.log(`## ALL SECTIONS (combined)`);
console.log(`Found: ${grandF} / ${grandT}  →  ${gpct}%`);
