// backend/src/routes/profiles.ts
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { bestMatch, l2Normalize } from "../embeddings";

const router = Router();

const CreateProfileSchema = z.object({
  name: z.string().min(1),
  embedding: z.array(z.number()).min(8), // adjust min length to your model
});

router.post("/", async (req, res) => {
  const parsed = CreateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { name, embedding } = parsed.data;
  const norm = l2Normalize(embedding);
  const r = await pool.query(
    "INSERT INTO profiles (name, embedding) VALUES ($1, $2) RETURNING id, name",
    [name, norm]
  );
  res.json(r.rows[0]);
});

router.get("/", async (_req, res) => {
  const r = await pool.query("SELECT id, name FROM profiles ORDER BY id DESC");
  res.json(r.rows);
});

router.post("/match", async (req, res) => {
  const EmbeddingSchema = z.object({
    embedding: z.array(z.number()).min(8),
    threshold: z.number().min(-1).max(1).optional(), // cosine threshold
  });
  const parsed = EmbeddingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const { embedding, threshold = 0.6 } = parsed.data;
  const norm = l2Normalize(embedding);
  const r = await pool.query("SELECT id, name, embedding FROM profiles");
  const candidates = r.rows.map((row) => ({
    id: row.id,
    name: row.name,
    embedding: row.embedding as number[],
  }));
  const { profile, score } = bestMatch(norm, candidates);
  if (!profile || score < threshold) return res.json({ match: null, score });
  res.json({ match: { id: profile.id, name: profile.name }, score });
});

export default router;
