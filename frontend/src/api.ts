// frontend/src/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000",
});

export async function createProfile(name: string, embedding: number[]) {
  const { data } = await api.post("/profiles", { name, embedding });
  return data as { id: string; name: string };
}

export async function matchProfile(embedding: number[], threshold?: number) {
  const { data } = await api.post("/profiles/match", { embedding, threshold });
  return data as { match: { id: string; name: string } | null; score: number };
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
