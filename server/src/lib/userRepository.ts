import { ObjectId, type Collection, type IndexDescription } from "mongodb";
import { getConnectedMongoDb } from "./mongo.js";
import type { User } from "../types/user.js";

interface UserDocument {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

type StoredUserDocument = UserDocument & { _id: ObjectId };

const userIndexes: IndexDescription[] = [
  {
    key: { email: 1 },
    unique: true,
    name: "unique_user_email",
  },
];

let indexesCreated = false;

async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const database = await getConnectedMongoDb();
  const collection = database.collection<UserDocument>("users");

  if (!indexesCreated) {
    await collection.createIndexes(userIndexes);
    indexesCreated = true;
  }

  return collection;
}

function mapUser(document: StoredUserDocument): User {
  return {
    id: document._id.toHexString(),
    name: document.name,
    email: document.email,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export async function findUserByEmail(email: string) {
  const collection = await getUsersCollection();
  return collection.findOne({ email });
}

export async function findPublicUserById(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const collection = await getUsersCollection();
  const document = await collection.findOne({ _id: new ObjectId(id) });
  return document ? mapUser(document) : null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const now = new Date().toISOString();
  const document: UserDocument = {
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  const collection = await getUsersCollection();
  const result = await collection.insertOne(document);

  return mapUser({ ...document, _id: result.insertedId });
}

export function toPublicUser(document: StoredUserDocument): User {
  return mapUser(document);
}
