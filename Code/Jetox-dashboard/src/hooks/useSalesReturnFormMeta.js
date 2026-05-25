import { useQuery } from "@tanstack/react-query";
import { salesReturnVouchersApi } from "../services/api";

export function useSalesReturnFormMeta(enabled = true) {
  return useQuery({
    queryKey: ["sales-return-form-meta"],
    queryFn: async () => {
      const res = await salesReturnVouchersApi.getFormMeta();
      const body = res?.data;
      const payload =
        body && typeof body === "object" && body.data && typeof body.data === "object"
          ? body.data
          : body;
      if (!payload || typeof payload !== "object") {
        return {
          nextSalesReturnVoucherNo: null,
          nextSalesReturnInvoicePrefix: null,
          nextSalesReturnInvoiceNumber: null,
          nextSalesReturnInvoiceNo: null,
          parties: [],
          partyAddresses: {},
        };
      }
      return {
        nextSalesReturnVoucherNo:
          typeof payload.nextSalesReturnVoucherNo === "string"
            ? payload.nextSalesReturnVoucherNo
            : null,
        nextSalesReturnInvoicePrefix:
          typeof payload.nextSalesReturnInvoicePrefix === "string"
            ? payload.nextSalesReturnInvoicePrefix
            : null,
        nextSalesReturnInvoiceNumber:
          typeof payload.nextSalesReturnInvoiceNumber === "string"
            ? payload.nextSalesReturnInvoiceNumber
            : null,
        nextSalesReturnInvoiceNo:
          typeof payload.nextSalesReturnInvoiceNo === "string"
            ? payload.nextSalesReturnInvoiceNo
            : null,
        parties: Array.isArray(payload.parties) ? payload.parties : [],
        partyAddresses:
          payload.partyAddresses && typeof payload.partyAddresses === "object"
            ? payload.partyAddresses
            : {},
      };
    },
    enabled: Boolean(enabled),
    staleTime: 60_000,
  });
}
