// frontend/src/App.tsx
import { useState } from "react";
import ProfileCreation from "./components/ProfileCreation";
import ProfileMatch from "./components/ProfileMatch";
import TasksReminders from "./components/TasksReminders";

export default function App() {
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeProfileName, setActiveProfileName] = useState<string | null>(
    null,
  );
  const [showProfileCreation, setShowProfileCreation] = useState(false);

  const handleProfileChange = (
    profileId: string | null,
    profileName: string | null,
  ) => {
    setActiveProfileId(profileId);
    setActiveProfileName(profileName);
    setShowProfileCreation(false);
  };

  const handleNoMatch = () => {
    setShowProfileCreation(true);
  };

  const handleProfileCreated = (profileId: string, profileName: string) => {
    setActiveProfileId(profileId);
    setActiveProfileName(profileName);
    setShowProfileCreation(false);
  };

  return (
    <div className="max-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="flex-shrink-0 px-6 py-7 border-b border-white/10 flex justify-center">
        <div className="w-full max-w-[1080px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-[56px] h-[56px] rounded-full bg-slate-900 grid place-items-center text-2xl">
              🎤
            </div>
            <div>
              <h1 className="m-0 text-2xl">Voice Profiling</h1>
              <p className="mt-1 text-sm text-slate-400">
                Speech-powered profile matching and voice chatbot interface.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto no-scrollbar">
        <div className="w-full max-w-[980px] mx-auto h-full grid gap-6 grid-rows-[auto_auto_1fr]">
          <ProfileMatch
            onProfileChange={handleProfileChange}
            onNoMatch={handleNoMatch}
          />

          {showProfileCreation && (
            <div className="p-6 bg-slate-900 rounded-[24px] border border-white/10">
              <ProfileCreation onProfileCreated={handleProfileCreated} />
            </div>
          )}

          <div className="p-6 rounded-[24px] bg-slate-900 border border-white/10 overflow-hidden">
            {activeProfileId && activeProfileName ? (
              <div className="h-full overflow-auto">
                <h3 className="mb-3">
                  Tasks & Reminders for {activeProfileName}
                </h3>
                <TasksReminders profileId={activeProfileId} />
              </div>
            ) : (
              <div className="text-slate-400">
                Sign in with your voice to view and manage tasks and reminders.
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 bottom-0 px-6 py-4 bg-slate-950/90 text-slate-400 text-center border-t border-white/10">
        Created by Komal Sainath - 2019 CSE
      </footer>
    </div>
  );
}
