import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./authonticated.middleware";

/** Attaches JWT user when Bearer token is present; does not reject missing auth. */
export const attachUserOptional = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET_KEY) {
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch {
    next();
  }
};
