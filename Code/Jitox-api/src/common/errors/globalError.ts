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

  // Mongoose schema validation (enum / required / type / etc.) — surface the
  // actual field reason as a 400 instead of a generic 500.
  if (err?.name === "ValidationError" && err?.errors) {
    const fieldErrors: Record<string, string> = {};
    for (const key of Object.keys(err.errors)) {
      fieldErrors[key] = err.errors[key]?.message || "Invalid value";
    }
    const firstField = Object.keys(fieldErrors)[0];
    return res.status(400).json({
      success: false,
      message: firstField ? fieldErrors[firstField] : err.message,
      fieldErrors,
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
