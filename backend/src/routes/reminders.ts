// backend/src/routes/reminders.ts
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

const router = Router();

const CreateReminder = z.object({
  profile_id: z.number().int(),
  message: z.string().min(1),
  remind_at: z.string(), // ISO timestamp
});

router.post("/", async (req, res) => {
  const parsed = CreateReminder.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { profile_id, message, remind_at } = parsed.data;
  const r = await pool.query(
    "INSERT INTO reminders (profile_id, message, remind_at) VALUES ($1, $2, $3) RETURNING *",
    [profile_id, message, remind_at]
  );
  res.json(r.rows[0]);
});

router.get("/:profileId", async (req, res) => {
  const profileId = Number(req.params.profileId);
  const r = await pool.query(
    "SELECT * FROM reminders WHERE profile_id=$1 ORDER BY remind_at ASC",
    [profileId]
  );
  res.json(r.rows);
});

export default router;
