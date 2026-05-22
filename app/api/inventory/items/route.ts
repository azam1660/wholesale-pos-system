import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { InventoryItem } from "@/models/Inventory";

export async function GET() {
  try {
    await dbConnect();
    const items = await InventoryItem.find({}).sort({ updatedAt: -1 });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const item = await InventoryItem.findOneAndUpdate(
      { productId: body.productId },
      body,
      { upsert: true, new: true }
    );
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
