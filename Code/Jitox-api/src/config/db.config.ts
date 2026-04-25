import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    console.error(
      "MongoDB connection failed: MONGO_URI is missing. Copy .env.development.example to .env.development and set MONGO_URI (must start with mongodb:// or mongodb+srv://)."
    );
    process.exit(1);
  }
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    console.error(
      "MongoDB connection failed: MONGO_URI must start with mongodb:// or mongodb+srv://"
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
