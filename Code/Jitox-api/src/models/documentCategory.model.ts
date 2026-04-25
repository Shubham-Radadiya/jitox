import mongoose, { Schema } from "mongoose";

export interface IDocumentCategory extends mongoose.Document {
  name: string;
  icon: string;
  inSidebar: boolean;
  sortIndex: number;
}

const documentCategorySchema = new Schema<IDocumentCategory>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: "📁" },
    inSidebar: { type: Boolean, default: true },
    sortIndex: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const DocumentCategory = mongoose.model<IDocumentCategory>(
  "DocumentCategory",
  documentCategorySchema
);

export default DocumentCategory;
