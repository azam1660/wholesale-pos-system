import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth-utils";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find the user case-insensitively
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username.trim()}$`, "i") } 
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
