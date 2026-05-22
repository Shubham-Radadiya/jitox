import { useQuery } from "@tanstack/react-query";
import { salesReturnVouchersApi } from "../services/api";

export function useSalesReturnFormMeta(enabled = true) {
  return useQuery({
    queryKey: ["sales-return-form-meta"],
    queryFn: async () => {
      const res = await salesReturnVouchersApi.getFormMeta();
      return res?.data;
    },
    enabled: Boolean(enabled),
    staleTime: 60_000,
  });
}
