export type NotificationJobType = "welcome-email" | "note-created-email";

export interface BaseNotificationJob {
  type: NotificationJobType;
  userEmail: string;
  createdAt: string;
}

export interface WelcomeEmailJob extends BaseNotificationJob {
  type: "welcome-email";
  userName: string;
}

export interface NoteCreatedEmailJob extends BaseNotificationJob {
  type: "note-created-email";
  noteId: string;
  noteTitle: string;
}

export type NotificationJob = WelcomeEmailJob | NoteCreatedEmailJob;
