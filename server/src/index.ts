import "dotenv/config";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { closeMongoConnection, connectToMongo } from "./lib/mongo.js";
import { closeRedisConnection, connectToRedis } from "./lib/redis.js";
import {
  closeRabbitMqConnection,
  connectToRabbitMq,
} from "./queues/rabbitmq.js";
import { attachChatWebSocketServer } from "./realtime/chatServer.js";

async function startServer() {
  await connectToMongo();
  await connectToRedis();
  await connectToRabbitMq();

  const app = await createApp();
  const server = app.listen(config.port, () => {
    console.log(`Syntax server listening on http://localhost:${config.port}`);
  });

  const webSocketServer = attachChatWebSocketServer(server);

  const shutdown = async () => {
    webSocketServer.close();
    server.close(async () => {
      await closeRabbitMqConnection();
      await closeRedisConnection();
      await closeMongoConnection();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start Syntax server", error);
  process.exit(1);
});
