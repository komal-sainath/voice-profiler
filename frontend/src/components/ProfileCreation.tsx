// frontend/src/components/ProfileCreation.tsx
import { useEffect, useState } from "react";
import { createProfile, getProfiles } from "../api";
import { blobToAudioBuffer } from "../ml/audio";
import { getEmbeddingFromAudioBuffer, loadRecognizer } from "../ml/tf";
import Recorder from "./Recorder";

type Props = {
  onProfileCreated?: (profileId: string, profileName: string) => void;
};

export default function ProfileCreation({ onProfileCreated }: Props) {
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const profiles = await getProfiles();
        setAvailableProfiles(profiles);
      } catch (err) {
        console.error("Failed to load profiles:", err);
      }
    };
    loadProfiles();
  }, []);

  const handleRecordingComplete = async (blob: Blob) => {
    setRecordingBlob(blob);
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setEmbedding(null);

    try {
      await loadRecognizer();
      const audioBuffer = await blobToAudioBuffer(blob);
      const emb = await getEmbeddingFromAudioBuffer(audioBuffer);
      setEmbedding(emb);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Failed to process recording. Please try again or reload the page.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert audio to data URL."));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleCreateProfile = async () => {
    if (isProcessing)
      return alert("Please wait while the recording is processed.");
    if (!embedding) return alert("Record first to get embedding.");
    if (!newProfileName.trim()) return alert("Enter profile name.");
    if (!recordingBlob) return alert("No recording available.");

    try {
      setIsProcessing(true);
      const audio = await blobToDataUrl(recordingBlob);
      const created = await createProfile(newProfileName, embedding, audio);

      const profiles = await getProfiles();
      setAvailableProfiles(profiles);

      setNewProfileName("");
      setEmbedding(null);
      setRecordingBlob(null);
      setSuccessMessage(`Profile "${created.name}" created successfully!`);

      onProfileCreated?.(created.id, created.name);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Failed to create profile. Check the console for details.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid gap-3">
      <h2>Create New Profile</h2>

      <div className="text-slate-500 text-sm">
        <p>Record your voice to create a new profile.</p>
        {availableProfiles.length > 0 && (
          <p>
            <strong>Existing profiles:</strong>{" "}
            {availableProfiles.map((p) => p.name).join(", ")}
          </p>
        )}
      </div>

      <Recorder onRecordingComplete={handleRecordingComplete} />

      {isProcessing && (
        <div className="text-sky-500">🎤 Processing voice...</div>
      )}

      {errorMessage && (
        <div className="rounded-md bg-red-100 p-2 text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-emerald-100 p-2 text-emerald-800">
          ✓ {successMessage}
        </div>
      )}

      {!isProcessing && embedding && (
        <div className="text-sm text-slate-500">
          Embedding extracted ({embedding.length} dimensions)
        </div>
      )}

      {embedding && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            placeholder="Profile name (e.g., John Doe)"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            disabled={isProcessing}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          />
          <button
            onClick={handleCreateProfile}
            disabled={isProcessing || !newProfileName.trim()}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {isProcessing ? "Creating..." : "Create Profile"}
          </button>
        </div>
      )}
    </div>
  );
}
