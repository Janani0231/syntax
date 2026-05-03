import { ObjectId, type Collection } from "mongodb";
import { getConnectedMongoDb } from "./mongo.js";
import {
  cacheNote,
  cacheNoteList,
  getCachedNote,
  getCachedNoteList,
  invalidateNoteCache,
} from "./noteCache.js";
import type { CreateNoteInput, Note, UpdateNoteInput } from "../types/note.js";

interface NoteDocument {
  ownerEmail: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

type StoredNoteDocument = NoteDocument & { _id: ObjectId };

async function getNotesCollection(): Promise<Collection<NoteDocument>> {
  const database = await getConnectedMongoDb();
  return database.collection<NoteDocument>("notes");
}

function mapNote(document: StoredNoteDocument): Note {
  return {
    id: document._id.toHexString(),
    title: document.title,
    content: document.content,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export async function listNotes(userEmail: string) {
  const cachedNotes = await getCachedNoteList(userEmail);

  if (cachedNotes) {
    return cachedNotes;
  }

  const collection = await getNotesCollection();
  const documents = await collection
    .find({ ownerEmail: userEmail })
    .sort({ updatedAt: -1 })
    .toArray();
  const notes = documents.map(mapNote);

  await cacheNoteList(userEmail, notes);

  return notes;
}

export async function findNoteById(userEmail: string, id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const cachedNote = await getCachedNote(userEmail, id);

  if (cachedNote) {
    return cachedNote;
  }

  const collection = await getNotesCollection();
  const document = await collection.findOne({
    _id: new ObjectId(id),
    ownerEmail: userEmail,
  });
  const note = document ? mapNote(document) : null;

  if (note) {
    await cacheNote(userEmail, note);
  }

  return note;
}

export async function createNote(userEmail: string, input: CreateNoteInput) {
  const now = new Date().toISOString();
  const document: NoteDocument = {
    ownerEmail: userEmail,
    title: input.title,
    content: input.content,
    createdAt: now,
    updatedAt: now,
  };

  const collection = await getNotesCollection();
  const result = await collection.insertOne(document);
  const note = mapNote({ ...document, _id: result.insertedId });

  await invalidateNoteCache(userEmail);
  await cacheNote(userEmail, note);

  return note;
}

export async function updateNote(
  userEmail: string,
  id: string,
  input: UpdateNoteInput,
) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const updates: Partial<Omit<NoteDocument, "_id" | "createdAt">> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    updates.title = input.title;
  }

  if (input.content !== undefined) {
    updates.content = input.content;
  }

  const collection = await getNotesCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id), ownerEmail: userEmail },
    { $set: updates },
    { returnDocument: "after" },
  );

  const note = result ? mapNote(result) : null;

  if (note) {
    await invalidateNoteCache(userEmail, id);
    await cacheNote(userEmail, note);
  }

  return note;
}

export async function deleteNote(userEmail: string, id: string) {
  if (!ObjectId.isValid(id)) {
    return false;
  }

  const collection = await getNotesCollection();
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
    ownerEmail: userEmail,
  });

  if (result.deletedCount === 1) {
    await invalidateNoteCache(userEmail, id);
    return true;
  }

  return false;
}
