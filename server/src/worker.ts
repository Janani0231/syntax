import "dotenv/config";
import { config } from "./config.js";
import { connectToRabbitMq } from "./queues/rabbitmq.js";
import type { NotificationJob } from "./queues/types.js";

function parseNotificationJob(content: Buffer): NotificationJob {
  return JSON.parse(content.toString("utf8")) as NotificationJob;
}

async function processNotificationJob(job: NotificationJob) {
  switch (job.type) {
    case "welcome-email": {
      console.log(
        `[notification-worker] Welcome email queued for ${job.userEmail} (${job.userName})`,
      );
      return;
    }
    case "note-created-email": {
      console.log(
        `[notification-worker] Note-created email queued for ${job.userEmail}: ${job.noteTitle} (${job.noteId})`,
      );
      return;
    }
  }
}

async function startWorker() {
  const channel = await connectToRabbitMq();

  if (!channel) {
    throw new Error("RabbitMQ is required to run the notification worker");
  }

  await channel.prefetch(5);

  await channel.consume(config.notificationQueueName, async (message) => {
    if (!message) return;

    try {
      const job = parseNotificationJob(message.content);
      await processNotificationJob(job);
      channel.ack(message);
    } catch (error) {
      console.error("[notification-worker] Failed to process notification job", error);
      channel.nack(message, false, false);
    }
  });

  console.log(
    `[notification-worker] Listening for jobs on ${config.notificationQueueName}`,
  );
}

startWorker().catch((error) => {
  console.error("[notification-worker] Failed to start", error);
  process.exit(1);
});
