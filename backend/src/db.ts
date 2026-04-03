// backend/src/db.ts
import { Db, MongoClient } from "mongodb";

let db: Db | null = null;

async function getDb(): Promise<Db> {
  if (db) return db;
  const client = new MongoClient(process.env.DATABASE_URL || "");
  await client.connect();
  db = client.db("voice_profiler");
  return db;
}

export async function initSchema() {
  const database = await getDb();

  // Create collections if they don't exist
  const collections = await database.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  if (!collectionNames.includes("profiles")) {
    await database.createCollection("profiles");
    await database.collection("profiles").createIndex({ name: 1 });
  }

  if (!collectionNames.includes("tasks")) {
    await database.createCollection("tasks");
    await database.collection("tasks").createIndex({ profile_id: 1 });
  }

  if (!collectionNames.includes("reminders")) {
    await database.createCollection("reminders");
    await database.collection("reminders").createIndex({ profile_id: 1 });
  }
}

export async function getProfilesCollection() {
  const database = await getDb();
  return database.collection("profiles");
}

export async function getTasksCollection() {
  const database = await getDb();
  return database.collection("tasks");
}

export async function getRemindersCollection() {
  const database = await getDb();
  return database.collection("reminders");
}
