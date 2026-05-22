import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const product = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const product = await Product.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const product = await Product.findByIdAndDelete(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
