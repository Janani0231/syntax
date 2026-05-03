import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import filesRouter from "./routes/files.js";
import notesRouter from "./routes/notes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    message: "Syntax backend is running",
    service: "syntax-server",
  });
});

app.use("/api/files", filesRouter);
app.use("/api/notes", notesRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
