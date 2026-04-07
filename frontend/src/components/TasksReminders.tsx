// frontend/src/components/TasksReminders.tsx
import { useEffect, useState } from "react";
import { createReminder, createTask, getReminders, getTasks } from "../api";

type Props = { profileId: string };

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
      taskDue || undefined,
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
    <div className="grid gap-4">
      <h3 className="text-lg">Tasks</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          placeholder="Task title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        />
        <input
          type="datetime-local"
          value={taskDue}
          onChange={(e) => setTaskDue(e.target.value)}
          className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        />
        <button
          onClick={addTask}
          className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="rounded-xl border border-slate-800 bg-slate-950 p-3"
          >
            <strong>{t.title}</strong>{" "}
            {t.due_date ? `— due ${new Date(t.due_date).toLocaleString()}` : ""}
          </li>
        ))}
      </ul>
      <h3 className="text-lg">Reminders</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          placeholder="Reminder message"
          value={remMsg}
          onChange={(e) => setRemMsg(e.target.value)}
          className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        />
        <input
          type="datetime-local"
          value={remAt}
          onChange={(e) => setRemAt(e.target.value)}
          className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        />
        <button
          onClick={addReminder}
          className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {reminders.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-slate-800 bg-slate-950 p-3"
          >
            <strong>{r.message}</strong> — at{" "}
            {new Date(r.remind_at).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
