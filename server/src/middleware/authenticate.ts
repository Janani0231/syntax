import type { RequestHandler } from "express";
import { verifyAuthToken } from "../lib/authService.js";
import { unauthorized } from "../lib/httpErrors.js";
import { findPublicUserById } from "../lib/userRepository.js";

function readBearerToken(headerValue: string | undefined) {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw unauthorized("Authorization header must use Bearer token format");
  }

  return token;
}

export const requireAuth: RequestHandler = async (request, _response, next) => {
  try {
    if (request.session.userId && request.session.userEmail) {
      const sessionUser = await findPublicUserById(request.session.userId);

      if (sessionUser && sessionUser.email === request.session.userEmail) {
        request.user = sessionUser;
        next();
        return;
      }

      request.session.destroy(() => undefined);
    }

    const token = readBearerToken(request.header("authorization"));

    if (!token) {
      throw unauthorized("Authentication session or bearer token is required");
    }

    const claims = verifyAuthToken(token);
    const user = await findPublicUserById(claims.sub);

    if (!user || user.email !== claims.email) {
      throw unauthorized("Invalid authentication token");
    }

    request.user = user;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      next(unauthorized("Authentication token has expired"));
      return;
    }

    if (error instanceof Error && error.name === "JsonWebTokenError") {
      next(unauthorized("Invalid authentication token"));
      return;
    }

    next(error);
  }
};
