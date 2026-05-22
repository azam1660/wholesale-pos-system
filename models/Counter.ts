import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document {
  name: string;
  seq: number;
}

const CounterSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

export async function getNextSequenceValue(sequenceName: string) {
  const sequenceDocument = await Counter.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
}
