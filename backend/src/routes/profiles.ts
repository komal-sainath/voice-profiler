// backend/src/routes/profiles.ts
import { Router } from "express";
import { z } from "zod";
import { getProfilesCollection } from "../db";
import { bestMatch, l2Normalize } from "../embeddings";

const router = Router();

const CreateProfileSchema = z.object({
  name: z.string().min(1),
  embedding: z.array(z.number()).min(8),
});

router.post("/", async (req, res) => {
  const parsed = CreateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { name, embedding } = parsed.data;
  const norm = l2Normalize(embedding);
  const collection = await getProfilesCollection();
  const result = await collection.insertOne({
    name,
    embedding: norm,
    created_at: new Date(),
  });
  res.json({ id: result.insertedId.toString(), name });
});

router.get("/", async (_req, res) => {
  const collection = await getProfilesCollection();
  const profiles = await collection.find({}).sort({ _id: -1 }).toArray();
  res.json(
    profiles.map((p) => ({
      id: p._id.toString(),
      name: p.name,
    })),
  );
});

router.post("/match", async (req, res) => {
  const EmbeddingSchema = z.object({
    embedding: z.array(z.number()).min(8),
    threshold: z.number().min(-1).max(1).optional(),
  });
  const parsed = EmbeddingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { embedding, threshold = 0.6 } = parsed.data;
  const norm = l2Normalize(embedding);
  const collection = await getProfilesCollection();
  const profiles = await collection.find({}).toArray();
  const candidates = profiles.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    embedding: p.embedding as number[],
  }));
  const { profile, score } = bestMatch(norm, candidates);
  if (!profile || score < threshold) return res.json({ match: null, score });
  res.json({ match: { id: profile.id, name: profile.name }, score });
});

export default router;
