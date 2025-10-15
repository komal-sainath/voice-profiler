// frontend/src/App.tsx
import { useState } from "react";
import ProfileMatch from "./components/ProfileMatch";
import TasksReminders from "./components/TasksReminders";

export default function App() {
  const [profileId, setProfileId] = useState<number | null>(null);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <h1>Voice Profiler</h1>
      <ProfileMatch />
      <hr style={{ margin: "24px 0" }} />
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          <span>Active profile ID:</span>
          <input
            type="number"
            value={profileId ?? ""}
            onChange={(e) => setProfileId(Number(e.target.value))}
            placeholder="Enter matched profile ID"
          />
        </label>
        {profileId && <TasksReminders profileId={profileId} />}
      </div>
    </div>
  );
}
