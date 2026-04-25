import { useQuery } from "@tanstack/react-query";
import { dashboardUiApi } from "../services/api";

export const emptyMeta = {
  parties: [],
  partyCreditHints: {},
  products: [],
  groups: [],
  units: [],
  locations: [],
  transporters: [],
  employees: [],
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
 */
export function usePurchaseFormMeta() {
  return useQuery({
    queryKey: ["purchase-form-meta"],
    queryFn: async () => {
      const { data } = await dashboardUiApi.getPurchaseFormMeta();
      if (!data || typeof data !== "object") return { ...emptyMeta };
      return {
        parties: Array.isArray(data.parties) ? data.parties : [],
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
      };
    },
    staleTime: 60_000,
  });
}
