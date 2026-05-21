import { useQuery } from "@tanstack/react-query";
import { dashboardUiApi } from "../services/api";

export const emptyMeta = {
  parties: [],
  partyAddresses: {},
  partyCreditHints: {},
  products: [],
  groups: [],
  units: [],
  locations: [],
  transporters: [],
  employees: [],
  nextPurchaseVoucherNo: null,
  nextQuotationVoucherNo: null,
  terms: [
    { value: "Cash", label: "Cash" },
    { value: "Credit", label: "Credit" },
    { value: "Online", label: "Online" },
    { value: "Cheque", label: "Cheque" },
  ],
  gst: [
    { value: "0", label: "0%" },
    { value: "5", label: "5%" },
    { value: "12", label: "12%" },
    { value: "18", label: "18%" },
  ],
};

/**
 * Master dropdowns for purchase voucher / invoice (accounts, products, employees).
 * @param {{ enabled?: boolean }} [opts] — pass `{ enabled: modalOpen }` to fetch only when needed (shared cache key).
 */
export function usePurchaseFormMeta({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["purchase-form-meta"],
    enabled,
    queryFn: async () => {
      const { data } = await dashboardUiApi.getPurchaseFormMeta();
      if (!data || typeof data !== "object") return { ...emptyMeta };
      return {
        parties: Array.isArray(data.parties) ? data.parties : [],
        partyAddresses:
          data.partyAddresses && typeof data.partyAddresses === "object"
            ? data.partyAddresses
            : {},
        partyCreditHints:
          data.partyCreditHints && typeof data.partyCreditHints === "object"
            ? data.partyCreditHints
            : {},
        products: Array.isArray(data.products) ? data.products : [],
        groups: Array.isArray(data.groups) ? data.groups : [],
        units: Array.isArray(data.units) ? data.units : [],
        locations: Array.isArray(data.locations) ? data.locations : [],
        transporters: Array.isArray(data.transporters) ? data.transporters : [],
        employees: Array.isArray(data.employees) ? data.employees : [],
        terms: Array.isArray(data.terms) && data.terms.length ? data.terms : emptyMeta.terms,
        gst: Array.isArray(data.gst) && data.gst.length ? data.gst : emptyMeta.gst,
        nextPurchaseVoucherNo:
          typeof data.nextPurchaseVoucherNo === "string"
            ? data.nextPurchaseVoucherNo
            : null,
        nextQuotationVoucherNo:
          typeof data.nextQuotationVoucherNo === "string"
            ? data.nextQuotationVoucherNo
            : null,
      };
    },
    staleTime: 60_000,
  });
}
