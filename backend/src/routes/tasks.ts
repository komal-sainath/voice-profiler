// backend/src/routes/tasks.ts
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

const router = Router();

const CreateTask = z.object({
  profile_id: z.number().int(),
  title: z.string().min(1),
  due_date: z.string().optional(), // ISO timestamp
});

router.post("/", async (req, res) => {
  const parsed = CreateTask.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { profile_id, title, due_date } = parsed.data;
  const r = await pool.query(
    "INSERT INTO tasks (profile_id, title, due_date) VALUES ($1, $2, $3) RETURNING *",
    [profile_id, title, due_date ?? null]
  );
  res.json(r.rows[0]);
});

router.get("/:profileId", async (req, res) => {
  const profileId = Number(req.params.profileId);
  const r = await pool.query(
    "SELECT * FROM tasks WHERE profile_id=$1 ORDER BY created_at DESC",
    [profileId]
  );
  res.json(r.rows);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const r = await pool.query(
    "UPDATE tasks SET completed = NOT completed WHERE id=$1 RETURNING *",
    [id]
  );
  res.json(r.rows[0]);
});

export default router;
