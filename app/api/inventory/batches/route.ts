import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { TransactionBatch } from "@/models/Inventory";

export async function GET() {
  try {
    await dbConnect();
    const batches = await TransactionBatch.find({}).sort({ createdAt: -1 });
    return NextResponse.json(batches);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    delete body._id;
    // Use upsert to avoid duplicate key errors if the batch is already saved
    const batch = await TransactionBatch.findOneAndUpdate(
      { batchNumber: body.batchNumber },
      body,
      { upsert: true, new: true }
    );
    return NextResponse.json(batch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
