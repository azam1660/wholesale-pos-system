import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Customer } from "@/models/People";

export async function GET() {
  try {
    await dbConnect();
    const customers = await Customer.find({}).sort({ name: 1 });
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch customers",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const customer = await Customer.create(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
