import mongoose, { Document, Schema } from "mongoose";
import { IProduct } from "../types/product.type";

const ProductSchema = new Schema<IProduct>(
  {
    productName: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    group: { type: String, required: true },
    units: { type: Number, required: true },
    billingRatePerUnit: { type: Number, trim: true, required: true },
    alternateUnits: { type: String, trim: true },
    packingStyle: { type: String, trim: true },
    where: { type: String, trim: true },
    mrpPerUnit: { type: String, trim: true },
    gstRate: { type: String, trim: true },
    hsnCode: { type: String, trim: true },
    productDescription: { type: String, trim: true },
    packagingType: { type: String, trim: true },
    defaultPackSize: { type: String, trim: true },
    batchNo: { type: String, trim: true },
    mfgDt: { type: Date, trim: true },
    expDt: { type: Date, trim: true },
    quantity: { type: Number, trim: true },
    rate: { type: Number, trim: true },
    amout: { type: Number, trim: true },
    stockQuantity: { type: Boolean, default: true },
    minimumReorderLevel: { type: Number, trim: true },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
