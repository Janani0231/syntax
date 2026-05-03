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

function readBooleanEnv(name: string, fallback: boolean) {
  const rawValue = process.env[name]?.trim().toLowerCase();

  if (!rawValue) {
    return fallback;
  }

  if (["1", "true", "yes", "on"].includes(rawValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(rawValue)) {
    return false;
  }

  throw new Error(`${name} must be a boolean value`);
}

function readNumberEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }

  return parsed;
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

function resolveProjectPath(value: string) {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function resolveStorageDir(storageDir: string) {
  return resolveProjectPath(storageDir);
}

export const config = {
  port: readPortEnv("PORT", 4000),
  mongoUri: readStringEnv("MONGODB_URI", "mongodb://127.0.0.1:27017"),
  mongoDbName: readStringEnv("MONGODB_DB_NAME", "syntax"),
  jwtSecret: readStringEnv("JWT_SECRET", "change-this-secret-in-production"),
  jwtExpiresIn: readStringEnv("JWT_EXPIRES_IN", "7d"),
  sessionSecret: readStringEnv("SESSION_SECRET", "change-this-session-secret"),
  sessionCookieName: readStringEnv("SESSION_COOKIE_NAME", "connect.sid"),
  sessionTtlSeconds: readNumberEnv("SESSION_TTL_SECONDS", 60 * 60 * 24 * 7),
  sessionCookieSecure: readBooleanEnv("SESSION_COOKIE_SECURE", false),
  corsOrigin: readStringEnv("CORS_ORIGIN", "http://localhost:5173"),
  redisUrl: readStringEnv("REDIS_URL", "redis://127.0.0.1:6379"),
  redisEnabled: readBooleanEnv("REDIS_ENABLED", true),
  noteCacheTtlSeconds: readNumberEnv("NOTE_CACHE_TTL_SECONDS", 60),
  rabbitMqUrl: readStringEnv("RABBITMQ_URL", "amqp://localhost:5672"),
  rabbitMqEnabled: readBooleanEnv("RABBITMQ_ENABLED", true),
  notificationQueueName: readStringEnv(
    "NOTIFICATION_QUEUE_NAME",
    "syntax.notifications",
  ),
  storageDir: resolveStorageDir(
    readStringEnv("FILE_STORAGE_DIR", "server/storage"),
  ),
  frontendDistDir: resolveProjectPath(
    readStringEnv("FRONTEND_DIST_DIR", "../dist"),
  ),
};
