import mongoose, { Document } from "mongoose";

export interface IProductItem {
  product: mongoose.Schema.Types.ObjectId;
  quantity: number;
  rateParUnit: number;
  amount: number;
  group: string;
  unit: string;
  category: string;
  subtotal: number;
}

export interface IQuatationVoucher extends Document {
  partyName: string;
  transportDetails?: string;
  deliveryAt?: string;
  orderby?: string;
  shipToAndBillTo?: string;
  voucherNo: string;
  invoiceNo: string;
  voucherDate: Date;
  supplierName: string;
  supplierAddress?: string;
  supplierGstNo?: string;
  items: IProductItem[];
  gstAmount: number;
  totalAmount: number;
  paymentMode?: string;
  basePrice?: number;
  dueDate: Date;
  stockDetails: {
    stockQuantity: boolean;
    productStatus?: boolean;
    generetePurchaseBill?: boolean;
    updateStockAfterOrderPlaced?: boolean;
    openingStock: Number;
    minimumReOrderLevel: Number;
  };
  paidAmount?: number;
  dashboardTab?: "pending" | "dispatched" | "partSupply" | "cancelled";
  dashboardOrderStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
