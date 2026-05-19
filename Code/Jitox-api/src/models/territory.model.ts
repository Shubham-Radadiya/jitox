import mongoose, { Schema } from "mongoose";
import { ITerritory } from "../types/territory.type";

const territorySchema = new Schema<ITerritory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, trim: true },
    states: { type: [String], default: [] },
    districts: { type: [String], default: [] },
    cities: { type: [String], default: [] },
    pincodes: { type: [String], default: [] },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

territorySchema.index({ isActive: 1 });

const Territory = mongoose.model<ITerritory>("Territory", territorySchema);

export default Territory;
