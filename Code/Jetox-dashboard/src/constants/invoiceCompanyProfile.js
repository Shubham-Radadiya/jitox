/**
 * Default company header for sales invoices (preview, review modal, PDF).
 * Update here to change branding across Order List → Create Invoice → Review Invoice.
 */
export const INVOICE_COMPANY_PROFILE = {
  companyName: "Jitox Algo",
  website: "www.jitoxagro.com",
  email: "jitoxagro@email.com",
  phone: "+91 00000 00000",
  addressLine1: "Business address",
  addressLine2: "City, State, IN - 000 000",
  taxId: "TAX ID 00XXXXX1234X0XX",
};

/** Right-side address block on invoice header (multi-line). */
export function invoiceCompanyTaxAddress(
  profile = INVOICE_COMPANY_PROFILE
) {
  return [profile.addressLine1, profile.addressLine2, profile.taxId]
    .filter(Boolean)
    .join("\n");
}

/** Fields passed to `InvoiceModal` / `buildInvoiceReviewPayload`. */
export function invoiceCompanyFields(profile = INVOICE_COMPANY_PROFILE) {
  return {
    companyName: profile.companyName,
    website: profile.website,
    email: profile.email,
    phone: profile.phone,
    taxAddress: invoiceCompanyTaxAddress(profile),
  };
}
