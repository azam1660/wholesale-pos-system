import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SubCategory } from "@/models/Category";

export async function GET() {
  try {
    await dbConnect();
    const categories = await SubCategory.find({}).populate("superCategoryId");

    // Convert MongoDB documents to plain objects with string IDs
    const categoriesData = categories.map((category: any) => ({
      _id: category._id.toString(),
      id: category._id.toString(),
      name: category.name,
      nameMr: category.nameMr,
      icon: category.icon,
      image: category.image,
      superCategoryId: category.superCategoryId?._id?.toString() || category.superCategoryId?.toString() || category.superCategoryId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return NextResponse.json(categoriesData);
  } catch (error: any) {
    console.error("Error fetching sub categories:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch sub categories",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const category = await SubCategory.create(body);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
