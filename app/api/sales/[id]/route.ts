import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Sale } from "@/models/Sale";
import { Product } from "@/models/Product";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    delete body._id;
    
    const sale = await Sale.findByIdAndUpdate(id, body, { new: true });
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const sale = await Sale.findByIdAndDelete(id);
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
