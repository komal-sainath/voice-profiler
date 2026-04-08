// frontend/src/api.ts
import axios from "axios";
import { blobToWAV } from "./utils/audioConverter";

const api = axios.create({
  baseURL: "http://localhost:4000",
});

/**
 * Convert Uint8Array to base64 string (cross-browser compatible)
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 8192;
  let binaryString = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binaryString += String.fromCharCode(...chunk);
  }

  return btoa(binaryString);
}

/**
 * Extract embedding from audio blob using backend FFT-based feature extraction
 */
export async function getEmbeddingFromAudio(
  audioBlob: Blob,
): Promise<number[]> {
  // Convert to WAV format (handles WebM, MP3, etc.)
  const wavBlob = await blobToWAV(audioBlob);

  // Convert blob to base64
  const arrayBuffer = await wavBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const base64Audio = uint8ArrayToBase64(bytes);

  // Send to backend for embedding extraction
  const { data } = await api.post("/embeddings", { audio: base64Audio });
  return data.embedding as number[];
}

export async function createProfile(
  name: string,
  embedding: number[],
  audio?: string,
) {
  const { data } = await api.post("/profiles", { name, embedding, audio });
  return data as { id: string; name: string };
}

export async function matchProfile(embedding: number[], threshold?: number) {
  const { data } = await api.post("/profiles/match", { embedding, threshold });
  return data as { match: { id: string; name: string } | null; score: number };
}

/**
 * Match profile using raw audio blob
 * Backend will extract embedding and perform matching
 */
export async function matchProfileWithAudio(
  audioBlob: Blob,
  threshold?: number,
) {
  // Convert to WAV format (handles WebM, MP3, etc.)
  const wavBlob = await blobToWAV(audioBlob);

  // Convert blob to base64
  const arrayBuffer = await wavBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const base64Audio = uint8ArrayToBase64(bytes);

  const { data } = await api.post("/profiles/match", {
    audio: base64Audio,
    threshold,
  });
  return data as { match: { id: string; name: string } | null; score: number };
}

export async function getProfiles() {
  const { data } = await api.get("/profiles");
  return data as Array<{ id: string; name: string }>;
}

export async function getTasks(profileId: string) {
  const { data } = await api.get(`/tasks/${profileId}`);
  return data;
}

export async function createTask(
  profileId: string,
  title: string,
  dueDate?: string,
) {
  const { data } = await api.post(`/tasks`, {
    profile_id: profileId,
    title,
    due_date: dueDate,
  });
  return data;
}

export async function getReminders(profileId: string) {
  const { data } = await api.get(`/reminders/${profileId}`);
  return data;
}

export async function createReminder(
  profileId: string,
  message: string,
  remindAt: string,
) {
  const { data } = await api.post(`/reminders`, {
    profile_id: profileId,
    message,
    remind_at: remindAt,
  });
  return data;
}
