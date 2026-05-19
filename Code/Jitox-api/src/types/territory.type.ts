import { Document, Types } from "mongoose";

export interface ITerritory extends Document {
  name: string;
  code?: string;
  states: string[];
  districts: string[];
  cities: string[];
  pincodes: string[];
  managerId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
