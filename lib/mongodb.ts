import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://kaladgiazam_db_user:wholesalepos@wholesalepos.ux4jvi9.mongodb.net/";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10s
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB connected successfully");
      return mongoose;
    }).catch((error) => {
      console.error("❌ MongoDB connection error:", error.message);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error("❌ MongoDB connection failed:", e.message);
    throw new Error(`MongoDB connection failed: ${e.message}. Please ensure MongoDB is running and MONGODB_URI is correct.`);
  }

  return cached.conn;
}

export default dbConnect;
