import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Sale } from "@/models/Sale";
import { Product } from "@/models/Product";

export async function GET() {
  try {
    await dbConnect();
    const sales = await Sale.find({}).sort({ timestamp: -1 });
    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    delete body._id;
    
    // Record sale and update stock
    const sale = await Sale.create(body);
    
    for (const item of body.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }
    
    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
