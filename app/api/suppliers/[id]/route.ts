import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Supplier } from "@/models/People";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const supplier = await Supplier.findByIdAndUpdate(id, body, { new: true });
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
