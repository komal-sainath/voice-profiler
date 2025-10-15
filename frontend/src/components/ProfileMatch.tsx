// frontend/src/components/ProfileMatch.tsx
import { useState } from "react";
import { createProfile, matchProfile } from "../api";
import { blobToAudioBuffer } from "../ml/audio";
import { getEmbeddingFromAudioBuffer, loadRecognizer } from "../ml/tf";
import Recorder from "./Recorder";

export default function ProfileMatch() {
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [result, setResult] = useState<{ id: number; name: string } | null>(
    null
  );
  const [score, setScore] = useState<number | null>(null);
  const [newProfileName, setNewProfileName] = useState("");

  const handleRecordingComplete = async (blob: Blob) => {
    await loadRecognizer();
    const audioBuffer = await blobToAudioBuffer(blob);
    const emb = await getEmbeddingFromAudioBuffer(audioBuffer);
    setEmbedding(emb);
    const match = await matchProfile(emb);
    setResult(match.match);
    setScore(match.score);
  };

  const handleCreateProfile = async () => {
    if (!embedding) return alert("Record first to get embedding.");
    if (!newProfileName.trim()) return alert("Enter profile name.");
    const created = await createProfile(newProfileName, embedding);
    setResult(created);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2>Voice Profile Matcher</h2>
      <Recorder onRecordingComplete={handleRecordingComplete} />
      {embedding && <div>Embedding length: {embedding.length}</div>}
      {score !== null && <div>Match score: {score.toFixed(3)}</div>}
      {result ? (
        <div>
          Matched Profile: {result.name} (ID {result.id})
        </div>
      ) : (
        <div>No match. Create a profile from this voice:</div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="New profile name"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
        />
        <button onClick={handleCreateProfile}>Create profile</button>
      </div>
    </div>
  );
}
