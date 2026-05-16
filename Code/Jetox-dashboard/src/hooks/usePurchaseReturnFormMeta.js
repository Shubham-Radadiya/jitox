import { useQuery } from "@tanstack/react-query";
import { purchaseReturnVouchersApi } from "../services/api";

/**
 * Return-specific meta: next auto voucher no. (e.g. `JITOX-DEMO-PR-001`) and the
 * active-customers list. Master dropdowns (products / units / GST / etc.) are
 * shared with the purchase form via `usePurchaseFormMeta`, so this hook stays small.
 */
export function usePurchaseReturnFormMeta(enabled = true) {
  return useQuery({
    queryKey: ["purchase-return-form-meta"],
    queryFn: async () => {
      const res = await purchaseReturnVouchersApi.getFormMeta();
      const body = res?.data;
      /** Backend wraps payload in `sendSuccess` → `{ status, message, data }`. */
      const payload =
        body && typeof body === "object" && body.data && typeof body.data === "object"
          ? body.data
          : body;
      if (!payload || typeof payload !== "object") {
        return { nextPurchaseReturnVoucherNo: null, parties: [] };
      }
      return {
        nextPurchaseReturnVoucherNo:
          typeof payload.nextPurchaseReturnVoucherNo === "string"
            ? payload.nextPurchaseReturnVoucherNo
            : null,
        parties: Array.isArray(payload.parties) ? payload.parties : [],
      };
    },
    enabled,
    staleTime: 60_000,
  });
}
