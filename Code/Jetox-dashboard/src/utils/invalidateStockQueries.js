/** After purchase/sales/manufacturing changes product qty, refresh product + stock UIs. */
export const STOCK_CHANGED_EVENT = "jitox:stock-changed";

export function invalidateProductAndStockQueries(queryClient) {
  if (queryClient) {
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STOCK_CHANGED_EVENT));
  }
}
