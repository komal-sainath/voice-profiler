// backend/src/routes/reminders.ts
import { Router } from "express";
import { z } from "zod";
import { getRemindersCollection } from "../db";

const router = Router();

const CreateReminder = z.object({
  profile_id: z.string(),
  message: z.string().min(1),
  remind_at: z.string(),
});

router.post("/", async (req, res) => {
  const parsed = CreateReminder.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { profile_id, message, remind_at } = parsed.data;
  const collection = await getRemindersCollection();
  const result = await collection.insertOne({
    profile_id,
    message,
    remind_at: new Date(remind_at),
    created_at: new Date(),
  });
  const doc = await collection.findOne({ _id: result.insertedId });
  res.json({
    id: doc?._id.toString(),
    profile_id: doc?.profile_id,
    message: doc?.message,
    remind_at: doc?.remind_at,
    created_at: doc?.created_at,
  });
});

router.get("/:profileId", async (req, res) => {
  const profileId = req.params.profileId;
  const collection = await getRemindersCollection();
  const reminders = await collection
    .find({ profile_id: profileId })
    .sort({ remind_at: 1 })
    .toArray();
  res.json(
    reminders.map((r) => ({
      id: r._id.toString(),
      profile_id: r.profile_id,
      message: r.message,
      remind_at: r.remind_at,
      created_at: r.created_at,
    })),
  );
});

export default router;
