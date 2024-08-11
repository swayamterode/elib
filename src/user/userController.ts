import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import userModel from "./userModel";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // Validate input data
  if (!name || !email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  // email validation using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(createHttpError(400, "Please enter a valid email"));
  }

  // password validation using regex
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{6,}$/;
  if (!passwordRegex.test(password)) {
    return next(
      createHttpError(
        400,
        "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
    );
  }

  try {
    // Check if the user with this email already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return next(createHttpError(400, "User with this email already exists"));
    }

    // Hash the password and create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate JWT token
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    // Send response
    res.json({
      success: true,
      accessToken: token,
      userId: newUser._id,
      message: "User created successfully",
    });
  } catch (error) {
    next(
      createHttpError(500, "An error occurred while processing your request")
    );
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    next(createHttpError(400, "All fields are required"));
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return next(
        createHttpError(400, `User with ${email} email does not exist`)
      );
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(createHttpError(400, "Invalid password for this email"));
    }
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });
    res.json({
      success: true,
      message: "User logged in successfully",
      accessToken: token,
      userId: user._id,
    });
  } catch (error) {
    next(
      createHttpError(500, "An error occurred while processing your request")
    );
  }

  res.json({ message: "test OK" });
};
export { createUser, loginUser };
