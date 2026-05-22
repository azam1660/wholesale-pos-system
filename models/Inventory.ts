import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryItem extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  category: string;
  unit: string;
  openingStock: number;
  purchases: number;
  sales: number;
  adjustments: number;
  closingStock: number;
  reorderLevel: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    productName: { type: String, required: true },
    category: { type: String },
    unit: { type: String },
    openingStock: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    adjustments: { type: Number, default: 0 },
    closingStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 10 },
    notes: { type: String },
  },
  { timestamps: true }
);

export const InventoryItem = mongoose.models.InventoryItem || mongoose.model<IInventoryItem>("InventoryItem", InventoryItemSchema);

export interface IStockTransaction extends Document {
  transactionNumber: string;
  productId: mongoose.Types.ObjectId;
  productName: string;
  type: "opening" | "purchase" | "sale" | "adjustment";
  quantity: number;
  date: string;
  reference?: string;
  notes?: string;
  batchId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const StockTransactionSchema: Schema = new Schema(
  {
    transactionNumber: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    type: { type: String, enum: ["opening", "purchase", "sale", "adjustment"], required: true },
    quantity: { type: Number, required: true },
    date: { type: String, required: true },
    reference: { type: String },
    notes: { type: String },
    batchId: { type: Schema.Types.ObjectId, ref: "TransactionBatch" },
  },
  { timestamps: true }
);

export const StockTransaction = mongoose.models.StockTransaction || mongoose.model<IStockTransaction>("StockTransaction", StockTransactionSchema);

export interface ITransactionBatch extends Document {
  batchNumber: string;
  type: "purchase" | "sale" | "adjustment";
  date: string;
  reference?: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    unit: string;
  }>;
  totalItems: number;
  totalQuantity: number;
  notes?: string;
  createdAt: Date;
}

const TransactionBatchSchema: Schema = new Schema(
  {
    batchNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ["purchase", "sale", "adjustment"], required: true },
    date: { type: String, required: true },
    reference: { type: String },
    items: [
      new Schema({
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
      }),
    ],
    totalItems: { type: Number, required: true },
    totalQuantity: { type: Number, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const TransactionBatch = mongoose.models.TransactionBatch || mongoose.model<ITransactionBatch>("TransactionBatch", TransactionBatchSchema);
