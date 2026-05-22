import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SuperCategory } from "@/models/Category";

export async function GET() {
  try {
    await dbConnect();
    const categories = await SuperCategory.find({}).sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Error fetching super categories:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch super categories",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const category = await SuperCategory.create(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
