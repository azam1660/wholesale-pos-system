import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { PurchaseOrder } from "@/models/PurchaseOrder";

export async function GET() {
  try {
    await dbConnect();
    const orders = await PurchaseOrder.find({}).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const order = await PurchaseOrder.create(body);
    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
