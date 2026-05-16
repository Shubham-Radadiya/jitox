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
        return { nextSalesVoucherNo: null, parties: [] };
      }
      return {
        nextSalesVoucherNo:
          typeof payload.nextSalesVoucherNo === "string"
            ? payload.nextSalesVoucherNo
            : null,
        parties: Array.isArray(payload.parties) ? payload.parties : [],
      };
    },
    enabled,
    staleTime: 60_000,
  });
}
