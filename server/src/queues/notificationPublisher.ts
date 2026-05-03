import { publishNotificationJob } from "./rabbitmq.js";

export async function queueWelcomeEmail(input: {
  userName: string;
  userEmail: string;
}) {
  await publishNotificationJob({
    type: "welcome-email",
    userName: input.userName,
    userEmail: input.userEmail,
    createdAt: new Date().toISOString(),
  });
}

export async function queueNoteCreatedEmail(input: {
  userEmail: string;
  noteId: string;
  noteTitle: string;
}) {
  await publishNotificationJob({
    type: "note-created-email",
    userEmail: input.userEmail,
    noteId: input.noteId,
    noteTitle: input.noteTitle,
    createdAt: new Date().toISOString(),
  });
}
