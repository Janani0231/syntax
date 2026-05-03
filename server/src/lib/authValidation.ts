import { badRequest } from "./httpErrors.js";
import type { LoginInput, RegisterInput } from "../types/user.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredString(payload: Record<string, unknown>, fieldName: string) {
  const value = payload[fieldName];

  if (typeof value !== "string") {
    throw badRequest(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw badRequest(`${fieldName} is required`);
  }

  return trimmed;
}

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(normalized)) {
    throw badRequest("email must be a valid email address");
  }

  return normalized;
}

function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw badRequest(
      `password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    );
  }

  return password;
}

export function validateRegisterInput(payload: unknown): RegisterInput {
  if (!isRecord(payload)) {
    throw badRequest("Request body must be a JSON object");
  }

  return {
    name: readRequiredString(payload, "name"),
    email: normalizeEmail(readRequiredString(payload, "email")),
    password: validatePassword(readRequiredString(payload, "password")),
  };
}

export function validateLoginInput(payload: unknown): LoginInput {
  if (!isRecord(payload)) {
    throw badRequest("Request body must be a JSON object");
  }

  return {
    email: normalizeEmail(readRequiredString(payload, "email")),
    password: readRequiredString(payload, "password"),
  };
}
