import amqp, { type ChannelModel, type ConfirmChannel } from "amqplib";
import { config } from "../config.js";
import type { NotificationJob } from "./types.js";

let connection: ChannelModel | null = null;
let channel: ConfirmChannel | null = null;
let rabbitUnavailable = false;
let warningLogged = false;

function logRabbitWarning(message: string, error: unknown) {
  if (warningLogged) return;
  warningLogged = true;
  console.warn(message, error);
}

export function isRabbitMqEnabled() {
  return config.rabbitMqEnabled && !rabbitUnavailable;
}

export async function connectToRabbitMq() {
  if (!config.rabbitMqEnabled) {
    console.log("RabbitMQ disabled by RABBITMQ_ENABLED=false");
    return null;
  }

  if (channel) {
    return channel;
  }

  try {
    connection = await amqp.connect(config.rabbitMqUrl);
    connection.on("error", (error) => {
      rabbitUnavailable = true;
      logRabbitWarning("RabbitMQ connection error; background jobs disabled", error);
    });
    connection.on("close", () => {
      channel = null;
      connection = null;
      rabbitUnavailable = true;
    });

    channel = await connection.createConfirmChannel();
    await channel.assertQueue(config.notificationQueueName, {
      durable: true,
    });

    rabbitUnavailable = false;
    warningLogged = false;
    console.log("RabbitMQ connected");
    return channel;
  } catch (error) {
    rabbitUnavailable = true;
    logRabbitWarning(
      "RabbitMQ unavailable; background notification jobs will be skipped",
      error,
    );
    return null;
  }
}

export async function getRabbitMqChannel() {
  if (!isRabbitMqEnabled()) {
    return null;
  }

  return connectToRabbitMq();
}

export async function publishNotificationJob(job: NotificationJob) {
  const activeChannel = await getRabbitMqChannel();

  if (!activeChannel) {
    return false;
  }

  const payload = Buffer.from(JSON.stringify(job));

  return activeChannel.publish("", config.notificationQueueName, payload, {
    contentType: "application/json",
    deliveryMode: 2,
    persistent: true,
  });
}

export async function closeRabbitMqConnection() {
  try {
    await channel?.close();
    await connection?.close();
  } finally {
    channel = null;
    connection = null;
  }
}
