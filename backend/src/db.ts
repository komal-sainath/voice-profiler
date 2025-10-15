// backend/src/db.ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      embedding DOUBLE PRECISION[] NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      profile_id INT REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      due_date TIMESTAMP,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      profile_id INT REFERENCES profiles(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      remind_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
