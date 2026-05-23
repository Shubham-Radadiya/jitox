import mongoose, { Document } from "mongoose";
import { ISalesItem } from "./salesVoucher.type";

export type SalesReturnApprovalStatus = "Pending" | "Approved" | "Rejected";

export interface ISalesReturnVoucher extends Document {
  partyName: string;
  invoiceNo?: string;
  dueDate?: Date;
  transportDetails?: string;
  deliveryAt?: string;
  orderby?: string;
  shipToAndBillTo?: string;
  billTo?: string;
  shipTo?: string;
  shipToPartyName?: string;
  shipDifferent?: boolean;
  narration?: string;
  returnReason?: string;
  voucherNo: string;
  voucherDate: Date;
  items: ISalesItem[];
  gstAmount: number;
  totalAmount: number;
  paymentMode?: string;
  basePrice?: number;
  approvalStatus: SalesReturnApprovalStatus;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectReason?: string;
  rejectNotes?: string;
  rejectProof?: string;
  sourceSalesId?: mongoose.Types.ObjectId;
  sourceQuotationId?: mongoose.Types.ObjectId;
  refundRequestId?: mongoose.Types.ObjectId;
  refundedAmount?: number;
  refundStatus?: "Pending" | "Processing" | "Partial" | "Refunded";
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
