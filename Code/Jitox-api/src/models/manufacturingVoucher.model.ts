import mongoose, { Schema } from "mongoose";
import {
  IManufacturingAdditionalCost,
  IManufacturingRawMaterial,
  IManufacturingVoucher,
  ManufacturingStatus,
} from "../types/manufacturingVoucher.type";

const RawMaterialSchema = new Schema<IManufacturingRawMaterial>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    requiredQty: { type: Number, required: true, min: 0 },
    ratePerUnit: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const AdditionalCostSchema = new Schema<IManufacturingAdditionalCost>(
  {
    account: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const STATUS_VALUES: ManufacturingStatus[] = [
  "Planned",
  "In Progress",
  "Paused",
  "Completed",
  "Failed",
];

const ManufacturingVoucherSchema = new Schema<IManufacturingVoucher>(
  {
    voucherNo: { type: String, required: true, trim: true, unique: true },
    batchCode: { type: String, required: true, trim: true },
    mfgDate: { type: Date, required: true },
    expDate: { type: Date },
    finishedProduct: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantityToProduce: { type: Number, required: true, min: 0.0001 },
    produceUnit: { type: String, trim: true },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: "Planned",
    },
    rawMaterials: { type: [RawMaterialSchema], default: [] },
    additionalCosts: { type: [AdditionalCostSchema], default: [] },
    remarks: { type: String, trim: true },
    rawMaterialTotal: { type: Number, default: 0 },
    additionalTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    landingCostPerUnit: { type: Number, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    failureReason: { type: String, trim: true },
    failureRemarks: { type: String, trim: true },
    supervisorName: { type: String, trim: true },
    failedAt: { type: Date },
    failureAttachment: { type: String, trim: true },
  },
  { timestamps: true }
);

const ManufacturingVoucher = mongoose.model<IManufacturingVoucher>(
  "ManufacturingVoucher",
  ManufacturingVoucherSchema
);

export default ManufacturingVoucher;
