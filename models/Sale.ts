import mongoose, { Schema, Document } from "mongoose";

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  unit: string;
  subCategoryId: mongoose.Types.ObjectId;
  subCategoryName: string;
  superCategoryId: mongoose.Types.ObjectId;
  superCategoryName: string;
}

export interface ISale extends Document {
  estimateNumber: string;
  date: string;
  timestamp: number;
  customerId?: mongoose.Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  isCashSale: boolean;
  items: ISaleItem[];
  subtotal: number;
  hamaliCharges: number;
  total: number;
  paymentMethod: "cash" | "card" | "upi" | "credit";
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
  unit: { type: String, required: true },
  subCategoryId: { type: Schema.Types.ObjectId, ref: "SubCategory" },
  subCategoryName: { type: String },
  superCategoryId: { type: Schema.Types.ObjectId, ref: "SuperCategory" },
  superCategoryName: { type: String },
});

const SaleSchema: Schema = new Schema(
  {
    estimateNumber: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    timestamp: { type: Number, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String },
    customerPhone: { type: String },
    isCashSale: { type: Boolean, default: true },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true },
    hamaliCharges: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "card", "upi", "credit"], default: "cash" },
    reference: { type: String },
  },
  { timestamps: true }
);

export const Sale = mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);
