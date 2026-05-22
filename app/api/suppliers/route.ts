import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Supplier } from "@/models/People";

export async function GET() {
  try {
    await dbConnect();
    const suppliers = await Supplier.find({}).sort({ name: 1 });
    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const supplier = await Supplier.create(body);
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
