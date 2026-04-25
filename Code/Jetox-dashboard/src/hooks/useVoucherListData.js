import { useQuery } from "@tanstack/react-query";
import {
  purchaseVouchersApi,
  purchaseReturnVouchersApi,
  paymentVouchersApi,
  receiptVouchersApi,
  expenseVouchersApi,
  cashVouchersApi,
  journalVouchersApi,
  quotationsApi,
  dashboardUiApi,
} from "../services/api";
import {
  mapPurchaseAggregateRow,
  mapPurchaseReturnAggregateRow,
  mapPaymentVoucherRow,
  mapAccountingReceiptRow,
  mapExpenseRow,
  mapCashVoucherRow,
  mapBankVoucherRow,
  mapJournalRow,
  mapQuotationRow,
  mapDashboardOrderRow,
} from "../utils/voucherRowMappers";

const STATIC_EMPTY_SLUGS = new Set(["sales-return", "manufacturing"]);

async function loadVoucherRows(slug) {
  if (STATIC_EMPTY_SLUGS.has(slug)) return [];

  switch (slug) {
    case "purchase": {
      const { data } = await purchaseVouchersApi.getAll();
      const list = Array.isArray(data?.data) ? data.data : [];
      return list.map(mapPurchaseAggregateRow);
    }
    case "purchase-return": {
      const { data } = await purchaseReturnVouchersApi.getAll();
      const list = Array.isArray(data?.data) ? data.data : [];
      return list.map(mapPurchaseReturnAggregateRow);
    }
    case "sales": {
      const { data } = await dashboardUiApi.getOrders({});
      const list = Array.isArray(data?.orders) ? data.orders : [];
      return list.map(mapDashboardOrderRow);
    }
    case "payment": {
      const { data } = await paymentVouchersApi.getAll();
      const list = Array.isArray(data?.data) ? data.data : [];
      return list.map(mapPaymentVoucherRow);
    }
    case "receipt": {
      const { data } = await receiptVouchersApi.getAll({});
      const list = Array.isArray(data?.data) ? data.data : [];
      return list.map(mapAccountingReceiptRow);
    }
    case "expenses": {
      const { data } = await expenseVouchersApi.getAll();
      const list = Array.isArray(data) ? data : [];
      return list.map(mapExpenseRow);
    }
    case "cash": {
      const { data } = await cashVouchersApi.getAll({
        transactionType: "Cash",
      });
      const list = Array.isArray(data) ? data : [];
      return list.map(mapCashVoucherRow);
    }
    case "bank": {
      const { data } = await cashVouchersApi.getAll({
        transactionType: "Bank",
      });
      const list = Array.isArray(data) ? data : [];
      return list.map(mapBankVoucherRow);
    }
    case "journal": {
      const { data } = await journalVouchersApi.getAll();
      const list = Array.isArray(data?.data) ? data.data : [];
      return list.map(mapJournalRow);
    }
    case "quotation": {
      const { data } = await quotationsApi.getAll();
      const list = Array.isArray(data?.data) ? data.data : [];
      return list.map(mapQuotationRow);
    }
    default:
      return [];
  }
}

export function useVoucherListData(voucherSlug) {
  return useQuery({
    queryKey: ["voucher-list", voucherSlug],
    queryFn: () => loadVoucherRows(voucherSlug),
    enabled: Boolean(voucherSlug),
    staleTime: 30_000,
  });
}
