// frontend/src/components/TasksReminders.tsx
import { useEffect, useState } from "react";
import { createReminder, createTask, getReminders, getTasks } from "../api";

type Props = { profileId: number };

export default function TasksReminders({ profileId }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [remMsg, setRemMsg] = useState("");
  const [remAt, setRemAt] = useState("");

  async function load() {
    const [t, r] = await Promise.all([
      getTasks(profileId),
      getReminders(profileId),
    ]);
    setTasks(t);
    setReminders(r);
  }

  useEffect(() => {
    load();
  }, [profileId]);

  const addTask = async () => {
    const created = await createTask(
      profileId,
      taskTitle,
      taskDue || undefined
    );
    setTasks([created, ...tasks]);
    setTaskTitle("");
    setTaskDue("");
  };

  const addReminder = async () => {
    const created = await createReminder(profileId, remMsg, remAt);
    setReminders([created, ...reminders]);
    setRemMsg("");
    setRemAt("");
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h3>Tasks</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Task title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <input
          type="datetime-local"
          value={taskDue}
          onChange={(e) => setTaskDue(e.target.value)}
        />
        <button onClick={addTask}>Add</button>
      </div>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong>{" "}
            {t.due_date ? `— due ${new Date(t.due_date).toLocaleString()}` : ""}
          </li>
        ))}
      </ul>
      <h3>Reminders</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Reminder message"
          value={remMsg}
          onChange={(e) => setRemMsg(e.target.value)}
        />
        <input
          type="datetime-local"
          value={remAt}
          onChange={(e) => setRemAt(e.target.value)}
        />
        <button onClick={addReminder}>Add</button>
      </div>
      <ul>
        {reminders.map((r) => (
          <li key={r.id}>
            <strong>{r.message}</strong> — at{" "}
            {new Date(r.remind_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
