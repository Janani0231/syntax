import { MongoClient, ServerApiVersion } from "mongodb";
import { config } from "../config.js";

const databaseName = config.mongoDbName;

const client = new MongoClient(config.mongoUri, {
  serverApi: ServerApiVersion.v1,
});

let isConnected = false;
let connectPromise: Promise<void> | null = null;

export async function connectToMongo() {
  if (!isConnected) {
    connectPromise ??= client.connect().then(() => {
      isConnected = true;
    });

    try {
      await connectPromise;
    } catch (error) {
      connectPromise = null;
      throw error;
    }
  }

  return client.db(databaseName);
}

export async function getConnectedMongoDb() {
  return connectToMongo();
}

export function getMongoDb() {
  if (!isConnected) {
    throw new Error("MongoDB connection has not been established");
  }

  return client.db(databaseName);
}

export async function closeMongoConnection() {
  if (isConnected) {
    await client.close();
    isConnected = false;
    connectPromise = null;
  }
}
