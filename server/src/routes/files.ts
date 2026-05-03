import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { badRequest } from "../lib/httpErrors.js";
import { getRequestUserEmail } from "../lib/requestUser.js";
import {
  createFile,
  deleteFile,
  getFile,
  listFiles,
  updateFile,
} from "../lib/fileStore.js";

const filesRouter = Router();

function getRouteParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

filesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const search =
      typeof request.query.search === "string" ? request.query.search : undefined;
    const userEmail = getRequestUserEmail(request);
    const files = await listFiles(userEmail, search);
    response.status(200).json({ files });
  }),
);

filesRouter.get(
  "/:name",
  asyncHandler(async (request, response) => {
    const fileName = getRouteParam(request.params.name);
    const userEmail = getRequestUserEmail(request);
    const file = await getFile(userEmail, fileName);
    response.status(200).json({ file });
  }),
);

filesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const userEmail = getRequestUserEmail(request);
    const { name, content } = request.body as { name?: string; content?: string };

    if (typeof name !== "string" || typeof content !== "string") {
      throw badRequest("Request body must include string fields: name and content");
    }

    const file = await createFile(userEmail, name, content);
    response.status(201).json({ file });
  }),
);

filesRouter.put(
  "/:name",
  asyncHandler(async (request, response) => {
    const fileName = getRouteParam(request.params.name);
    const userEmail = getRequestUserEmail(request);
    const { content } = request.body as { content?: string };

    if (typeof content !== "string") {
      throw badRequest("Request body must include a string field: content");
    }

    const file = await updateFile(userEmail, fileName, content);
    response.status(200).json({ file });
  }),
);

filesRouter.delete(
  "/:name",
  asyncHandler(async (request, response) => {
    const fileName = getRouteParam(request.params.name);
    const userEmail = getRequestUserEmail(request);
    await deleteFile(userEmail, fileName);
    response.status(204).send();
  }),
);

export default filesRouter;
