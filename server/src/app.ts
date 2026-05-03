import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { requireAuth } from "./middleware/authenticate.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { createSessionMiddleware } from "./middleware/session.js";
import authRouter from "./routes/auth.js";
import filesRouter from "./routes/files.js";
import notesRouter from "./routes/notes.js";

export async function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(await createSessionMiddleware());

  app.get("/api/health", (_request, response) => {
    response.status(200).json({
      message: "Syntax backend is running",
      service: "syntax-server",
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/files", requireAuth, filesRouter);
  app.use("/api/notes", requireAuth, notesRouter);

  app.use(express.static(config.frontendDistDir));

  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith("/api")) {
      next();
      return;
    }

    const indexPath = path.join(config.frontendDistDir, "index.html");

    if (!fs.existsSync(indexPath)) {
      next();
      return;
    }

    response.sendFile(indexPath);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
