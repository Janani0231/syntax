import "dotenv/config";
import app from "./app.js";
import { config } from "./config.js";
import { closeMongoConnection, connectToMongo } from "./lib/mongo.js";

async function startServer() {
  await connectToMongo();

  const server = app.listen(config.port, () => {
    console.log(`Syntax server listening on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
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
