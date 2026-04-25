import { Response } from "express";
import { AppError } from "../common/errors/AppError";
import { HttpStatusCode } from "../common/errors/httpStatusCode";

function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: ReadonlyArray<keyof T>
): string[] {
  const missingFields: string[] = [];

  requiredFields.forEach((field) => {
    const value = data[field];

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      missingFields.push(field as string);
    }
  });

  return missingFields;
}

export function validateAndRespond<T extends Record<string, any>>(
  data: T,
  requiredFields: ReadonlyArray<keyof T>,
  res: Response
): boolean {
  const missingFields = validateRequiredFields(data, requiredFields);

  if (missingFields.length > 0) {
    throw new AppError(
      HttpStatusCode.BAD_REQUEST,
      "Some required fields are missing",
      missingFields
    );
  }

  return true;
}
