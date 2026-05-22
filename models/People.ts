import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export interface ISupplier extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
