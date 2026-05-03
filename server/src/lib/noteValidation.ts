import { HttpError } from "./httpErrors.js";
import type { CreateNoteInput, UpdateNoteInput } from "../types/note.js";

export class NoteValidationError extends HttpError {
  constructor(message: string, statusCode = 400) {
    super(message, statusCode);
    this.name = "NoteValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeString(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw new NoteValidationError(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new NoteValidationError(`${fieldName} is required`);
  }

  return trimmed;
}

export function validateCreateNoteInput(payload: unknown): CreateNoteInput {
  if (!isRecord(payload)) {
    throw new NoteValidationError("Request body must be a JSON object");
  }

  return {
    title: normalizeString(payload.title, "title"),
    content: normalizeString(payload.content, "content"),
  };
}

export function validateUpdateNoteInput(payload: unknown): UpdateNoteInput {
  if (!isRecord(payload)) {
    throw new NoteValidationError("Request body must be a JSON object");
  }

  const update: UpdateNoteInput = {};

  if ("title" in payload) {
    update.title = normalizeString(payload.title, "title");
  }

  if ("content" in payload) {
    update.content = normalizeString(payload.content, "content");
  }

  if (!("title" in payload) && !("content" in payload)) {
    throw new NoteValidationError("At least one of title or content is required");
  }

  return update;
}
