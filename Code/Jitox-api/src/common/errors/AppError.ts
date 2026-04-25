export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public missingFields?: string[];

  constructor(statusCode: number, message: string, missingFields?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.missingFields = missingFields;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
