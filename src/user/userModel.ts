import mongoose from "mongoose";
import { User } from "./userInterface";
const useSchema = new mongoose.Schema<User>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.model<User>("User", useSchema); // exporting the model so that we can use it in the controller
