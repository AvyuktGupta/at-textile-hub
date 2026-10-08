import mongoose from "mongoose";
import env from "./env.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB error:", err.message);
  });

  await mongoose.connect(env.mongoUri, {
    autoIndex: !env.isProduction,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[db] Connected to ${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
