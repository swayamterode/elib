import mongoose from "mongoose";
import { config } from "./config";

const connectDB = async () => {
  try {
    // connection events
    mongoose.connection.on("connected", () => {
      console.log("Connected to database");
    });
    // If the connection throws an error
    mongoose.connection.on("error", (error) => {
      console.log("Failed to connect to DB", error);
      process.exit(1);
    });
    await mongoose.connect(config.databaseURL as string);
  } catch (error) {
    console.log("Failed to connect to DB", error);
    process.exit(1);
  }
};

export default connectDB;
