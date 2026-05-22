import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SubCategory } from "@/models/Category";
import { Product } from "@/models/Product";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const category = await SubCategory.findByIdAndUpdate(id, body, { new: true });
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    await Product.deleteMany({ subCategoryId: id });
    const category = await SubCategory.findByIdAndDelete(id);
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
