import {
  purchaseVouchersApi,
  purchaseReturnVouchersApi,
  dashboardUiApi,
} from "../../services/api";
import {
  purchaseDocToDetailShape,
  salesOrderResponseToPurchaseDetail,
} from "../../utils/voucherRowMappers";

export async function fetchPurchaseDetail(id) {
  const { data } = await purchaseVouchersApi.getById(id);
  return purchaseDocToDetailShape(data);
}

export async function fetchPurchaseReturnDetail(id) {
  const { data } = await purchaseReturnVouchersApi.getById(id);
  return purchaseDocToDetailShape(data);
}

export async function fetchSalesOrderDetail(id) {
  const { data } = await dashboardUiApi.getOrder(id);
  return salesOrderResponseToPurchaseDetail(data);
}
