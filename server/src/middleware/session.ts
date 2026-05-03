import session from "express-session";
import { RedisStore } from "connect-redis";
import { config } from "../config.js";
import { getRedisClient } from "../lib/redis.js";

export async function createSessionMiddleware() {
  const redisClient = await getRedisClient();

  return session({
    name: config.sessionCookieName,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: redisClient
      ? new RedisStore({
          client: redisClient,
          prefix: "syntax:sess:",
          ttl: config.sessionTtlSeconds,
        })
      : undefined,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.sessionCookieSecure,
      maxAge: config.sessionTtlSeconds * 1000,
    },
  });
}
