import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../lib/httpErrors.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new HttpError(`Route not found: ${request.method} ${request.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (response.headersSent) {
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ message: "Request body contains invalid JSON" });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ message: "Internal server error" });
};
