import mongoose, { Schema, Document } from "mongoose";

export interface ISuperCategory extends Document {
  name: string;
  nameMr?: string;
  icon: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SuperCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    nameMr: { type: String },
    icon: { type: String, required: true },
    image: { type: String },
  },
  { timestamps: true }
);

export const SuperCategory = mongoose.models.SuperCategory || mongoose.model<ISuperCategory>("SuperCategory", SuperCategorySchema);

export interface ISubCategory extends Document {
  name: string;
  nameMr?: string;
  icon: string;
  image?: string;
  superCategoryId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    nameMr: { type: String },
    icon: { type: String, required: true },
    image: { type: String },
    superCategoryId: { type: Schema.Types.ObjectId, ref: "SuperCategory", required: true },
  },
  { timestamps: true }
);

export const SubCategory = mongoose.models.SubCategory || mongoose.model<ISubCategory>("SubCategory", SubCategorySchema);
