/**
 * Embeddings Route
 * Endpoint to extract audio embeddings using FFT-based feature extraction
 */

import { Router } from "express";
import { z } from "zod";
import { getEmbeddingFromAudio } from "../audioEmbeddings";

const router = Router();

// Schema for embedding extraction request
const EmbeddingRequestSchema = z.object({
  audio: z.string(), // Base64-encoded audio data
});

/**
 * POST /embeddings
 * Extract embedding from raw audio file
 * Request body: { audio: "base64-encoded-audio" }
 * Response: { embedding: [128 numbers] }
 */
router.post("/", async (req, res) => {
  try {
    const parsed = EmbeddingRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid request format", details: parsed.error });
    }

    const { audio } = parsed.data;

    // Decode base64 audio to buffer
    let audioBuffer: Buffer;
    try {
      audioBuffer = Buffer.from(audio, "base64");
    } catch (error) {
      return res.status(400).json({ error: "Invalid base64 audio data" });
    }

    // Extract embedding from audio
    const embedding = getEmbeddingFromAudio(audioBuffer);

    // Verify embedding is valid
    if (!Array.isArray(embedding)) {
      console.error("Embedding is not an array:", typeof embedding);
      return res
        .status(400)
        .json({ error: "Failed to extract valid embedding: not an array" });
    }

    if (embedding.length !== 128) {
      console.error("Embedding length is", embedding.length, "expected 128");
      return res.status(400).json({
        error: `Failed to extract valid embedding: expected 128 dimensions, got ${embedding.length}`,
      });
    }

    const invalidIndex = embedding.findIndex(
      (n) => typeof n !== "number" || !isFinite(n),
    );
    if (invalidIndex !== -1) {
      console.error(
        `Invalid value at index ${invalidIndex}:`,
        embedding[invalidIndex],
      );
      return res.status(400).json({
        error: `Failed to extract valid embedding: invalid value at dimension ${invalidIndex}`,
      });
    }

    res.json({ embedding });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error extracting embedding:", errorMessage);
    res.status(400).json({
      error: "Failed to extract embedding from audio",
      details: errorMessage,
    });
  }
});

export default router;
