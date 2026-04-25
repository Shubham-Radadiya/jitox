import type { Request, Response, NextFunction } from "express";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid id format",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (!err.isOperational) {
    console.error("UNEXPECTED ERROR 💥:", err);
    statusCode = 500;
    message = "Something went wrong!";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.missingFields && { missingFields: err.missingFields }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
