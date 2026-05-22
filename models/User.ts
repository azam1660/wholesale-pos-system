import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: "pos" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["pos", "admin"], default: "pos", required: true },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
