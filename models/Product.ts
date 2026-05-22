import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  nameMr?: string;
  price: number;
  stock: number;
  unit: string;
  image?: string;
  subCategoryId: mongoose.Types.ObjectId;
  hamaliValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    nameMr: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    image: { type: String },
    subCategoryId: { type: Schema.Types.ObjectId, ref: "SubCategory", required: true },
    hamaliValue: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
