import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
}

export interface IPurchaseOrder extends Document {
  orderNumber: string;
  date: string;
  supplierId?: mongoose.Types.ObjectId;
  supplierName?: string;
  supplierPhone?: string;
  isCashPurchase: boolean;
  items: IPurchaseOrderItem[];
  subtotal: number;
  total: number;
  status: "pending" | "completed" | "cancelled";
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
});

const PurchaseOrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String },
    supplierPhone: { type: String },
    isCashPurchase: { type: Boolean, default: true },
    items: [PurchaseOrderItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
    reference: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);
