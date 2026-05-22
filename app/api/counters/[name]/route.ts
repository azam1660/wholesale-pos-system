import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getNextSequenceValue } from "@/models/Counter";

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    await dbConnect();
    const seq = await getNextSequenceValue(name);
    return NextResponse.json({ seq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
