import type { Request } from "express";
import { badRequest } from "./httpErrors.js";

export function getRequestUserEmail(request: Request) {
  const headerValue = request.header("x-user-email")?.trim().toLowerCase();

  if (!headerValue) {
    throw badRequest("Missing required header: x-user-email");
  }

  return headerValue;
}
