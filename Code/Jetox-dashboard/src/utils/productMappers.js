import dayjs from "dayjs";

/** Inventory line value: current qty × rate (updates when stock changes). */
export function resolveProductLineAmount(p) {
  const qty = Number(p.quantity) || 0;
  const rate =
    p.rate != null && Number.isFinite(Number(p.rate))
      ? Number(p.rate)
      : Number(p.billingRatePerUnit) || 0;
  return qty * rate;
}

export function mapProductToListRow(p) {
  const id = p._id || p.id;
  const created = p.createdAt ? dayjs(p.createdAt).format("DD-MMM-YY") : "—";
  const amt = `₹${resolveProductLineAmount(p).toLocaleString("en-IN")}`;
  return {
    _id: id,
    Date: created,
    "Product Name": p.productName || "—",
    Group: p.group || "—",
    Category: p.category || "—",
    Unit: formatUnitForDisplay(p.units),
    Amount: amt,
  };
}

export function mapProductToPriceRow(p) {
  return {
    _id: p._id || p.id,
    "Product Name": p.productName || "—",
    "Packing Style": p.packingStyle || "—",
    "Rate per Ltr":
      p.billingRatePerUnit != null
        ? `₹${Number(p.billingRatePerUnit).toLocaleString("en-IN")}`
        : "—",
    "GST Rate": p.gstRate || "—",
    "MRP Per Unit": p.mrpPerUnit || "—",
  };
}

/** Legacy products stored units as numeric codes (1 = kg, etc.). */
const UNIT_NUM_TO_SELECT = {
  1: "kg",
  2: "ltr",
  3: "gm",
  4: "ml",
};

const UNIT_VALUE_LABELS = {
  kg: "KG",
  ltr: "Litre",
  gm: "Gram",
  ml: "ML",
};

/** Map API / legacy numeric unit into dropdown value (e.g. kg). */
export function normalizeUnitFromApi(units) {
  if (units == null || units === "") return "";
  const n = Number(units);
  if (Number.isFinite(n) && UNIT_NUM_TO_SELECT[n]) return UNIT_NUM_TO_SELECT[n];
  return String(units).trim();
}

/** Human-readable unit for tables (never show legacy codes like "1"). */
export function formatUnitForDisplay(units) {
  const key = normalizeUnitFromApi(units);
  if (!key) return "—";
  const lower = key.toLowerCase();
  return UNIT_VALUE_LABELS[lower] ?? key;
}

/** Persist selected dropdown value as unit name, not legacy numeric code. */
export function unitForApiPayload(formValue) {
  const v = String(formValue ?? "").trim();
  if (!v) return "";
  const n = Number(v);
  if (Number.isFinite(n) && UNIT_NUM_TO_SELECT[n]) return UNIT_NUM_TO_SELECT[n];
  return v;
}

/** Ensure a value appears in dropdown options (label defaults to value). */
export function mergeDropdownOption(options, value, label) {
  const v = String(value ?? "").trim();
  if (!v) return options;
  if (options.some((o) => String(o.value) === v || String(o.label) === v)) {
    return options;
  }
  const lb =
    label != null && String(label).trim() ? String(label).trim() : v;
  return [...options, { value: v, label: lb }];
}

export function createEmptyProductForm() {
  return {
    productName: "",
    category: "",
    group: "",
    units: "",
    alternateUnits: "",
    whereFrom: "",
    whereTo: "",
    billingRate: "",
    packingStyle: "",
    mrp: "",
    gstRate: "",
    hsnCode: "",
    productDescription: "",
    packagingType: "",
    defaultPackSize: "",
    batchNo: "",
    mfgDate: "",
    expDate: "",
    qty: "",
    rate: "",
    amount: "",
    stockEnabled: true,
    minReorderLevel: "50",
  };
}

function stripGstDigits(s) {
  return String(s ?? "")
    .replace(/%/g, "")
    .trim();
}

/** Map API / Mongo product document into AddProductModal form state. */
export function mapApiProductToForm(p) {
  if (!p) return createEmptyProductForm();
  const whereStr = String(p.where || "").trim();
  let whereFrom = "";
  let whereTo = "";
  const segs = whereStr.split("=").map((x) => x.trim());
  if (segs.length >= 2) {
    whereFrom = segs[0];
    whereTo = segs[1];
  }
  const unitsVal = normalizeUnitFromApi(p.units);

  return {
    ...createEmptyProductForm(),
    productName: p.productName || "",
    category: String(p.category || ""),
    group: String(p.group || ""),
    units: unitsVal,
    alternateUnits: p.alternateUnits || "",
    whereFrom,
    whereTo,
    billingRate:
      p.billingRatePerUnit != null ? String(p.billingRatePerUnit) : "",
    packingStyle: p.packingStyle || "",
    mrp: p.mrpPerUnit != null ? String(p.mrpPerUnit) : "",
    gstRate: p.gstRate ? stripGstDigits(String(p.gstRate)) : "",
    hsnCode: p.hsnCode || "",
    productDescription: p.productDescription || "",
    packagingType: p.packagingType || "",
    defaultPackSize: p.defaultPackSize || "",
    batchNo: p.batchNo || "",
    mfgDate: p.mfgDt ? dayjs(p.mfgDt) : "",
    expDate: p.expDt ? dayjs(p.expDt) : "",
    qty: p.quantity != null ? String(p.quantity) : "",
    rate: p.rate != null ? String(p.rate) : "",
    amount:
      p.quantity != null || p.rate != null || p.billingRatePerUnit != null
        ? String(resolveProductLineAmount(p))
        : p.amout != null
          ? String(p.amout)
          : "",
    stockEnabled: p.stockQuantity !== false,
    minReorderLevel:
      p.minimumReorderLevel != null ? String(p.minimumReorderLevel) : "50",
  };
}
