import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { TransactionBatch, StockTransaction } from "@/models/Inventory";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const batch = await TransactionBatch.findByIdAndUpdate(id, body, { new: true });
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(batch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    // In current frontend, deleteBatch also reverses inventory. 
    // Here we just delete the batch and its related transactions.
    await StockTransaction.deleteMany({ batchId: id });
    const batch = await TransactionBatch.findByIdAndDelete(id);
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
