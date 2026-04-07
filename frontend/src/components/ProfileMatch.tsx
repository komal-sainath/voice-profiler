// frontend/src/components/ProfileMatch.tsx
import { useEffect, useState } from "react";
import { createProfile, getProfiles, matchProfile } from "../api";
import { blobToAudioBuffer } from "../ml/audio";
import { getEmbeddingFromAudioBuffer, loadRecognizer } from "../ml/tf";
import Recorder from "./Recorder";

export default function ProfileMatch() {
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [score, setScore] = useState<number | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
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

    try {
      await loadRecognizer();
      const audioBuffer = await blobToAudioBuffer(blob);
      const emb = await getEmbeddingFromAudioBuffer(audioBuffer);
      setEmbedding(emb);

      // Only attempt profile matching if user is signed in (has active profile)
      if (activeProfileId) {
        const match = await matchProfile(emb);
        setResult(match.match);
        setScore(match.score);
      } else {
        // User not signed in, just prepare for profile creation
        setResult(null);
        setScore(null);
      }
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
      const audio = await blobToDataUrl(recordingBlob);
      const created = await createProfile(newProfileName, embedding, audio);
      setResult(created);
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      alert("Failed to create profile. Check the console for details.");
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2>Voice Profile Matcher</h2>

      {/* Sign In Section */}
      <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 4 }}>
        <h3>Sign In</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={activeProfileId || ""}
            onChange={(e) => setActiveProfileId(e.target.value || null)}
            style={{ flex: 1 }}
          >
            <option value="">Not signed in</option>
            {availableProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} (ID: {profile.id})
              </option>
            ))}
          </select>
          {activeProfileId && (
            <button onClick={() => setActiveProfileId(null)}>Sign Out</button>
          )}
        </div>
        {activeProfileId ? (
          <p style={{ marginTop: 8, color: "green" }}>
            Signed in as:{" "}
            {availableProfiles.find((p) => p.id === activeProfileId)?.name}
          </p>
        ) : (
          <p style={{ marginTop: 8, color: "#666" }}>
            Sign in to enable voice matching. Without signing in, you can only
            create new profiles.
          </p>
        )}
      </div>

      <Recorder onRecordingComplete={handleRecordingComplete} />
      {isProcessing && <div>Processing recorded audio...</div>}
      {!isProcessing && recordingBlob && !embedding && (
        <div style={{ color: "#b00" }}>
          Recording received, but embedding could not be generated.
        </div>
      )}
      {embedding && <div>Embedding length: {embedding.length}</div>}
      {score !== null && <div>Match score: {score.toFixed(3)}</div>}
      {errorMessage && <div style={{ color: "#b00" }}>{errorMessage}</div>}
      {result ? (
        <div>
          Matched Profile: {result.name} (ID {result.id})
        </div>
      ) : activeProfileId ? (
        <div>No match found. Create a profile from this voice:</div>
      ) : (
        <div>Create a profile from this voice:</div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="New profile name"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
        />
        <button
          onClick={handleCreateProfile}
          disabled={isProcessing || !embedding}
        >
          {isProcessing ? "Processing embedding..." : "Create profile"}
        </button>
      </div>
    </div>
  );
}
