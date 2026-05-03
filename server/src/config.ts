import path from "node:path";

function readStringEnv(name: string, fallback?: string) {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

function readPortEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`${name} must be a valid TCP port between 1 and 65535`);
  }

  return parsed;
}

function resolveStorageDir(storageDir: string) {
  return path.isAbsolute(storageDir)
    ? storageDir
    : path.resolve(process.cwd(), storageDir);
}

export const config = {
  port: readPortEnv("PORT", 4000),
  mongoUri: readStringEnv("MONGODB_URI", "mongodb://127.0.0.1:27017"),
  mongoDbName: readStringEnv("MONGODB_DB_NAME", "syntax"),
  storageDir: resolveStorageDir(readStringEnv("FILE_STORAGE_DIR", "server/storage")),
};
