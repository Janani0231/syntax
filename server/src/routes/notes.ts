import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { notFound } from "../lib/httpErrors.js";
import { getRequestUserEmail } from "../lib/requestUser.js";
import {
  validateCreateNoteInput,
  validateUpdateNoteInput,
} from "../lib/noteValidation.js";
import {
  createNote,
  deleteNote,
  findNoteById,
  listNotes,
  updateNote,
} from "../lib/noteRepository.js";

const notesRouter = Router();

function getRouteParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

notesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const userEmail = getRequestUserEmail(request);
    const notes = await listNotes(userEmail);
    response.status(200).json({ notes });
  }),
);

notesRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const noteId = getRouteParam(request.params.id);
    const userEmail = getRequestUserEmail(request);
    const note = await findNoteById(userEmail, noteId);

    if (!note) {
      throw notFound("Note not found");
    }

    response.status(200).json({ note });
  }),
);

notesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const userEmail = getRequestUserEmail(request);
    const input = validateCreateNoteInput(request.body);
    const note = await createNote(userEmail, input);
    response.status(201).json({ note });
  }),
);

notesRouter.put(
  "/:id",
  asyncHandler(async (request, response) => {
    const noteId = getRouteParam(request.params.id);
    const userEmail = getRequestUserEmail(request);
    const input = validateUpdateNoteInput(request.body);
    const updatedNote = await updateNote(userEmail, noteId, input);

    if (!updatedNote) {
      throw notFound("Note not found");
    }

    response.status(200).json({ note: updatedNote });
  }),
);

notesRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const noteId = getRouteParam(request.params.id);
    const userEmail = getRequestUserEmail(request);
    const wasDeleted = await deleteNote(userEmail, noteId);

    if (!wasDeleted) {
      throw notFound("Note not found");
    }

    response.status(204).send();
  }),
);

export default notesRouter;
