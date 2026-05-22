import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { PurchaseOrder } from "@/models/PurchaseOrder";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const order = await PurchaseOrder.findByIdAndUpdate(id, body, { new: true });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const order = await PurchaseOrder.findByIdAndDelete(id);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
