export const voucherList = [
  { name: "Purchase Voucher", slug: "purchase" },
  { name: "Purchase Return Voucher", slug: "purchase-return" },
  { name: "Sales Voucher", slug: "sales" },
  { name: "Sales Return Voucher", slug: "sales-return" },
  { name: "Payment Voucher", slug: "payment" },
  { name: "Receipt Voucher", slug: "receipt" },
  { name: "Expenses", slug: "expenses" },
  { name: "Cash", slug: "cash" },
  { name: "Bank", slug: "bank" },
  { name: "Manufacturing", slug: "manufacturing" },
  { name: "Journal", slug: "journal" },
  { name: "Quotation", slug: "quotation" },
];

export const getVoucherPath = (slug) =>
  `/dashboard/accounting-voucher/${slug}`;

export const voucherNavItems = voucherList.map((item) => ({
  ...item,
  path: getVoucherPath(item.slug),
}));









