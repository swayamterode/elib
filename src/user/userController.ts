import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";

import userModel from "./userModel";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  //getting the data from the request body
  const { name, email, password } = req.body;
  //validating the data
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error); // passing the error to the next middleware
  }
  // checking if the user with this email already exists
  const user = await userModel.findOne({ email });
  if (user) {
    const userExistsError = createHttpError(
      400,
      "User with this email already exists"
    );
    return next(userExistsError);
  }
  // creating the user
  const newUser = new userModel({ name, email, password });
  await newUser.save();

  // response
  res.json({ message: "User Created for testing" });
};
export { createUser }; // this will export the createUser function
