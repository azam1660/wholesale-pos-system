import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Product } from "@/models/Product";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const subCategoryId = searchParams.get("subCategoryId");

    // Convert string subCategoryId to ObjectId if provided
    const query = subCategoryId
      ? { subCategoryId: mongoose.Types.ObjectId.isValid(subCategoryId) ? new mongoose.Types.ObjectId(subCategoryId) : subCategoryId }
      : {};
    const products = await Product.find(query).sort({ name: 1 });

    // Convert MongoDB documents to plain objects with string IDs
    const productsData = products.map((product: any) => ({
      _id: product._id.toString(),
      id: product._id.toString(),
      name: product.name,
      nameMr: product.nameMr,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      image: product.image,
      subCategoryId: product.subCategoryId?.toString() || product.subCategoryId,
      hamaliValue: product.hamaliValue || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return NextResponse.json(productsData);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch products",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    delete body._id;
    const product = await Product.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
