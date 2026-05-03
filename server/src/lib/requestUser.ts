import type { Request } from "express";
import { unauthorized } from "./httpErrors.js";

export function getRequestUserEmail(request: Request) {
  if (!request.user) {
    throw unauthorized("Authentication is required");
  }

  return request.user.email;
}
