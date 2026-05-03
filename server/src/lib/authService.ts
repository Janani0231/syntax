import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";
import type { JwtUserClaims, User } from "../types/user.js";

const SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createAuthToken(user: User) {
  const signOptions: SignOptions = {
    subject: user.id,
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      email: user.email,
    },
    config.jwtSecret,
    signOptions,
  );
}

export function verifyAuthToken(token: string): JwtUserClaims {
  const decoded = jwt.verify(token, config.jwtSecret);

  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }

  if (typeof decoded.sub !== "string" || typeof decoded.email !== "string") {
    throw new Error("Invalid token claims");
  }

  return {
    sub: decoded.sub,
    email: decoded.email,
  };
}
