// backend/src/routes/tasks.ts
import { Router } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getTasksCollection } from "../db";

const router = Router();

const CreateTask = z.object({
  profile_id: z.string(),
  title: z.string().min(1),
  due_date: z.string().optional(),
});

router.post("/", async (req, res) => {
  const parsed = CreateTask.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { profile_id, title, due_date } = parsed.data;
  const collection = await getTasksCollection();
  const result = await collection.insertOne({
    profile_id,
    title,
    due_date: due_date ? new Date(due_date) : null,
    completed: false,
    created_at: new Date(),
  });
  const doc = await collection.findOne({ _id: result.insertedId });
  res.json({
    id: doc?._id.toString(),
    profile_id: doc?.profile_id,
    title: doc?.title,
    due_date: doc?.due_date,
    completed: doc?.completed,
    created_at: doc?.created_at,
  });
});

router.get("/:profileId", async (req, res) => {
  const profileId = req.params.profileId;
  const collection = await getTasksCollection();
  const tasks = await collection
    .find({ profile_id: profileId })
    .sort({ created_at: -1 })
    .toArray();
  res.json(
    tasks.map((t) => ({
      id: t._id.toString(),
      profile_id: t.profile_id,
      title: t.title,
      due_date: t.due_date,
      completed: t.completed,
      created_at: t.created_at,
    })),
  );
});

router.patch("/:id", async (req, res) => {
  const id = req.params.id;
  const collection = await getTasksCollection();
  const task = await collection.findOne({ _id: new ObjectId(id) });
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { completed: !task?.completed } },
    { returnDocument: "after" },
  );

  if (!result?.value) return res.status(404).json({ error: "Task not found" });

  res.json({
    id: result.value._id.toString(),
    profile_id: result.value.profile_id,
    title: result.value.title,
    due_date: result.value.due_date,
    completed: result.value.completed,
    created_at: result.value.created_at,
  });
});

export default router;
