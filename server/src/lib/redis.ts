import { createClient, type RedisClientType } from "redis";
import { config } from "../config.js";

let redisClient: RedisClientType | null = null;
let redisUnavailable = false;
let warningLogged = false;

export function isRedisCacheEnabled() {
  return config.redisEnabled && !redisUnavailable;
}

export async function connectToRedis() {
  if (!config.redisEnabled) {
    console.log("Redis cache disabled by REDIS_ENABLED=false");
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  const client = createClient({
    url: config.redisUrl,
    socket: {
      connectTimeout: 1_000,
      reconnectStrategy: false,
    },
  });

  client.on("error", (error) => {
    redisUnavailable = true;

    if (!warningLogged) {
      warningLogged = true;
      console.warn("Redis cache unavailable; continuing without cache", error);
    }
  });

  try {
    await client.connect();
    redisClient = client as RedisClientType;
    redisUnavailable = false;
    warningLogged = false;
    console.log("Redis cache connected");
    return redisClient;
  } catch (error) {
    redisUnavailable = true;

    if (!warningLogged) {
      warningLogged = true;
      console.warn(
        "Redis cache connection failed; continuing without cache",
        error,
      );
    }

    try {
      client.destroy();
    } catch {
      // The client may already be closed after a failed connection attempt.
    }

    return null;
  }
}

export async function getRedisClient() {
  if (!isRedisCacheEnabled()) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  return connectToRedis();
}

export async function closeRedisConnection() {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }

  redisClient = null;
}
