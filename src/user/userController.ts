import { Request, Response, NextFunction } from "express";

const createUser = (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "User Create for testing" });
};
export { createUser }; // this will export the createUser function
