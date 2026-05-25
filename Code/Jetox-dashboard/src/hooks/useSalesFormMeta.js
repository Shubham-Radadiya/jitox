import { useQuery } from "@tanstack/react-query";
import { salesVouchersApi } from "../services/api";

/**
 * Sales-specific meta: next auto voucher no. (e.g. `JITOX-DEMO-SL-001`) and the
 * active-customers list. Master dropdowns (products / units / GST / etc.) are
 * shared via `usePurchaseFormMeta`, so this hook stays small.
 */
export function useSalesFormMeta(enabled = true) {
  return useQuery({
    queryKey: ["sales-form-meta"],
    queryFn: async () => {
      const res = await salesVouchersApi.getFormMeta();
      const body = res?.data;
      const payload =
        body && typeof body === "object" && body.data && typeof body.data === "object"
          ? body.data
          : body;
      if (!payload || typeof payload !== "object") {
        return {
          nextSalesVoucherNo: null,
          nextSalesInvoicePrefix: null,
          nextSalesInvoiceNumber: null,
          nextSalesInvoiceNo: null,
          parties: [],
          partyAddresses: {},
        };
      }
      return {
        nextSalesVoucherNo:
          typeof payload.nextSalesVoucherNo === "string"
            ? payload.nextSalesVoucherNo
            : null,
        nextSalesInvoicePrefix:
          typeof payload.nextSalesInvoicePrefix === "string"
            ? payload.nextSalesInvoicePrefix
            : null,
        nextSalesInvoiceNumber:
          typeof payload.nextSalesInvoiceNumber === "string"
            ? payload.nextSalesInvoiceNumber
            : null,
        nextSalesInvoiceNo:
          typeof payload.nextSalesInvoiceNo === "string"
            ? payload.nextSalesInvoiceNo
            : null,
        parties: Array.isArray(payload.parties) ? payload.parties : [],
        partyAddresses:
          payload.partyAddresses && typeof payload.partyAddresses === "object"
            ? payload.partyAddresses
            : {},
      };
    },
    enabled,
    staleTime: 60_000,
  });
}
