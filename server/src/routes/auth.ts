import { Router, type Request } from "express";
import { config } from "../config.js";
import {
  createAuthToken,
  hashPassword,
  verifyPassword,
} from "../lib/authService.js";
import {
  validateLoginInput,
  validateRegisterInput,
} from "../lib/authValidation.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { conflict, unauthorized } from "../lib/httpErrors.js";
import {
  createUser,
  findUserByEmail,
  toPublicUser,
} from "../lib/userRepository.js";
import { requireAuth } from "../middleware/authenticate.js";
import { queueWelcomeEmail } from "../queues/notificationPublisher.js";

const authRouter = Router();

function storeSessionUser(
  request: Request,
  user: { id: string; email: string },
) {
  request.session.userId = user.id;
  request.session.userEmail = user.email;
}

authRouter.post(
  "/register",
  asyncHandler(async (request, response) => {
    const input = validateRegisterInput(request.body);
    const existingUser = await findUserByEmail(input.email);

    if (existingUser) {
      throw conflict("A user with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await createUser({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    const token = createAuthToken(user);
    storeSessionUser(request, user);
    void queueWelcomeEmail({ userName: user.name, userEmail: user.email });

    response.status(201).json({ user, token });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (request, response) => {
    const input = validateLoginInput(request.body);
    const userDocument = await findUserByEmail(input.email);

    if (!userDocument) {
      throw unauthorized("Invalid email or password");
    }

    const passwordMatches = await verifyPassword(
      input.password,
      userDocument.passwordHash,
    );

    if (!passwordMatches) {
      throw unauthorized("Invalid email or password");
    }

    const user = toPublicUser(userDocument);
    const token = createAuthToken(user);
    storeSessionUser(request, user);

    response.status(200).json({ user, token });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    response.status(200).json({ user: request.user });
  }),
);

authRouter.post("/logout", (request, response, next) => {
  request.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    response.clearCookie(config.sessionCookieName);
    response.status(204).send();
  });
});

export default authRouter;
