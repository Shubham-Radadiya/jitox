import mongoose, { Document } from "mongoose";

export interface IPurchaseItem {
  product: mongoose.Schema.Types.ObjectId;
  quantity: number;
  rateParUnit: number;
  amount: number;
  group: string;
  unit: string;
  category: string;
  subtotal: Number;
  remarks?: string;
  hsn?: string;
  batch?: string;
  expDate?: string;
  mfgDate?: string;
  mrp?: string;
}

export interface IPurchaseVoucher extends Document {
  partyName: string;
  transportDetails?: string;
  deliveryAt?: string;
  orderby?: string;
  shipToAndBillTo?: string;
  billTo?: string;
  shipTo?: string;
  shipDifferent?: boolean;
  narration?: string;
  termsAndConditions?: string;
  voucherNo: string;
  voucherDate: Date;
  supplierName: string;
  supplierAddress?: string;
  supplierGstNo?: string;
  items: IPurchaseItem[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentMode?: string;
  basePrice?: number;
  stockDetails: {
    stockQuantity: boolean;
    productStatus?: boolean;
    generetePurchaseBill?: boolean;
    updateStockAfterOrderPlaced?: boolean;
    openingStock?: number;
    minimumReOrderLevel?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
