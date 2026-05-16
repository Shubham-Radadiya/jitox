import { Document, Types } from "mongoose";

export type ManufacturingStatus =
  | "Planned"
  | "In Progress"
  | "Paused"
  | "Completed"
  | "Failed";

export interface IManufacturingRawMaterial {
  product: Types.ObjectId;
  requiredQty: number;
  ratePerUnit: number;
  unit?: string;
  subtotal: number;
}

export interface IManufacturingAdditionalCost {
  account: string;
  qty: number;
  unit?: string;
  rate: number;
  amount: number;
}

export interface IManufacturingVoucher extends Document {
  voucherNo: string;
  batchCode: string;
  mfgDate: Date;
  expDate?: Date;
  finishedProduct: Types.ObjectId;
  quantityToProduce: number;
  produceUnit?: string;
  status: ManufacturingStatus;
  rawMaterials: IManufacturingRawMaterial[];
  additionalCosts: IManufacturingAdditionalCost[];
  remarks?: string;
  rawMaterialTotal: number;
  additionalTotal: number;
  grandTotal: number;
  landingCostPerUnit: number;
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  failureRemarks?: string;
  supervisorName?: string;
  failedAt?: Date;
  failureAttachment?: string;
}
