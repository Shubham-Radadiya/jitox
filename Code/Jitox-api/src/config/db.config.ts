import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGO_URI is missing. Set it in Render → Environment (Atlas connection string)."
    );
  }
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error(
      "MONGO_URI must start with mongodb:// or mongodb+srv://"
    );
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (error) {
    throw new Error(
      `MongoDB connection failed: ${error instanceof Error ? error.message : error}`
    );
  }
};

export default connectDB;
