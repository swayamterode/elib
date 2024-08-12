import { Response, Request, NextFunction } from "express";
import createHttpError from "http-errors";
import { verify } from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization");
  if (!token) {
    return next(
      createHttpError(401, "Authorization header (Bearer token) is missing")
    );
  }
  try {
    const parsedToken = token.split(" ")[1];
    const decoded = verify(parsedToken, process.env.JWT_SECRET as string);
    const _req = req as AuthRequest;
    _req.userId = decoded.sub as string;
    next(); // call the next middleware
  } catch (error) {
    next(createHttpError(401, "Unauthorized Token"));
  }
};

export default authenticate;
