import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { HttpError } from "./httpErrors.js";

const storageDir = config.storageDir;

export type StoredFileSummary = {
  name: string;
  size: number;
  modifiedAt: string;
};

export type StoredFileRecord = StoredFileSummary & {
  content: string;
};

export class FileStoreError extends HttpError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = "FileStoreError";
  }
}

async function ensureStorageDir() {
  await fs.mkdir(storageDir, { recursive: true });
}

async function ensureUserStorageDir(userEmail: string) {
  const userDir = path.join(storageDir, encodeURIComponent(userEmail));
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
}

function normalizeFileName(fileName: string) {
  const trimmed = fileName.trim();
  if (!trimmed) {
    throw new FileStoreError("File name is required", 400);
  }

  const normalized = path.basename(trimmed);
  if (normalized !== trimmed) {
    throw new FileStoreError("Invalid file name", 400);
  }

  return normalized;
}

async function readFileStats(userDir: string, fileName: string) {
  const target = path.join(userDir, normalizeFileName(fileName));
  const stats = await fs.stat(target);

  return {
    path: target,
    summary: {
      name: fileName,
      size: stats.size,
      modifiedAt: stats.mtime.toISOString(),
    },
  };
}

export async function listFiles(userEmail: string, search?: string) {
  await ensureStorageDir();
  const userDir = await ensureUserStorageDir(userEmail);

  const entries = await fs.readdir(userDir);
  const files = await Promise.all(
    entries.map(async (entry) => {
      const { summary } = await readFileStats(userDir, entry);
      return summary;
    })
  );

  const normalizedSearch = search?.trim().toLowerCase();
  const filteredFiles = normalizedSearch
    ? files.filter((file) => file.name.toLowerCase().includes(normalizedSearch))
    : files;

  return filteredFiles.sort((left, right) => {
    return new Date(right.modifiedAt).getTime() - new Date(left.modifiedAt).getTime();
  });
}

export async function getFile(userEmail: string, fileName: string): Promise<StoredFileRecord> {
  await ensureStorageDir();
  const userDir = await ensureUserStorageDir(userEmail);

  try {
    const normalizedName = normalizeFileName(fileName);
    const { path: filePath, summary } = await readFileStats(userDir, normalizedName);
    const content = await fs.readFile(filePath, "utf8");

    return {
      ...summary,
      content,
    };
  } catch (error) {
    if (error instanceof FileStoreError) {
      throw error;
    }

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new FileStoreError("File not found", 404);
    }

    throw error;
  }
}

export async function createFile(userEmail: string, fileName: string, content: string) {
  await ensureStorageDir();
  const userDir = await ensureUserStorageDir(userEmail);

  const normalizedName = normalizeFileName(fileName);
  const target = path.join(userDir, normalizedName);

  try {
    await fs.access(target);
    throw new FileStoreError("File already exists", 409);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  await fs.writeFile(target, content, "utf8");
  return getFile(userEmail, normalizedName);
}

export async function updateFile(userEmail: string, fileName: string, content: string) {
  await ensureStorageDir();
  const userDir = await ensureUserStorageDir(userEmail);

  const normalizedName = normalizeFileName(fileName);
  const target = path.join(userDir, normalizedName);

  try {
    await fs.access(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new FileStoreError("File not found", 404);
    }

    throw error;
  }

  await fs.writeFile(target, content, "utf8");
  return getFile(userEmail, normalizedName);
}

export async function deleteFile(userEmail: string, fileName: string) {
  await ensureStorageDir();
  const userDir = await ensureUserStorageDir(userEmail);

  const normalizedName = normalizeFileName(fileName);
  const target = path.join(userDir, normalizedName);

  try {
    await fs.unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new FileStoreError("File not found", 404);
    }

    throw error;
  }
}
