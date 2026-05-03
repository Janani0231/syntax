import { config } from "../config.js";
import { getRedisClient } from "./redis.js";
import type { Note } from "../types/note.js";

const CACHE_PREFIX = "syntax:notes";

function normalizeOwner(ownerEmail: string) {
  return ownerEmail.trim().toLowerCase();
}

function listKey(ownerEmail: string) {
  return `${CACHE_PREFIX}:list:${normalizeOwner(ownerEmail)}`;
}

function detailKey(ownerEmail: string, noteId: string) {
  return `${CACHE_PREFIX}:detail:${normalizeOwner(ownerEmail)}:${noteId}`;
}

async function readJson<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();

  if (!client) {
    return null;
  }

  try {
    const rawValue = await client.get(key);
    return rawValue ? (JSON.parse(rawValue) as T) : null;
  } catch (error) {
    console.warn(`Redis cache read failed for key ${key}`, error);
    return null;
  }
}

async function writeJson(key: string, value: unknown) {
  if (config.noteCacheTtlSeconds <= 0) {
    return;
  }

  const client = await getRedisClient();

  if (!client) {
    return;
  }

  try {
    await client.set(key, JSON.stringify(value), {
      EX: config.noteCacheTtlSeconds,
    });
  } catch (error) {
    console.warn(`Redis cache write failed for key ${key}`, error);
  }
}

export async function getCachedNoteList(ownerEmail: string) {
  return readJson<Note[]>(listKey(ownerEmail));
}

export async function cacheNoteList(ownerEmail: string, notes: Note[]) {
  await writeJson(listKey(ownerEmail), notes);
}

export async function getCachedNote(ownerEmail: string, noteId: string) {
  return readJson<Note>(detailKey(ownerEmail, noteId));
}

export async function cacheNote(ownerEmail: string, note: Note) {
  await writeJson(detailKey(ownerEmail, note.id), note);
}

export async function invalidateNoteCache(ownerEmail: string, noteId?: string) {
  const client = await getRedisClient();

  if (!client) {
    return;
  }

  const keys = [listKey(ownerEmail)];

  if (noteId) {
    keys.push(detailKey(ownerEmail, noteId));
  }

  try {
    await client.del(keys);
  } catch (error) {
    console.warn("Redis cache invalidation failed", error);
  }
}
