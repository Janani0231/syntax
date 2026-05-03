export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export function badRequest(message: string) {
  return new HttpError(message, 400);
}

export function unauthorized(message: string) {
  return new HttpError(message, 401);
}

export function forbidden(message: string) {
  return new HttpError(message, 403);
}

export function notFound(message: string) {
  return new HttpError(message, 404);
}

export function conflict(message: string) {
  return new HttpError(message, 409);
}
