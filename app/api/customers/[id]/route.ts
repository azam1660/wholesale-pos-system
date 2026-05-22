import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Customer } from "@/models/People";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const customer = await Customer.findByIdAndUpdate(id, body, { new: true });
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
