// frontend/src/components/ProfileMatch.tsx
import { useEffect, useState } from "react";
import { matchProfile } from "../api";
import { blobToAudioBuffer } from "../ml/audio";
import { getEmbeddingFromAudioBuffer, loadRecognizer } from "../ml/tf";
import Recorder from "./Recorder";

const MATCH_THRESHOLD = 0.6;

type ChatMessage = {
  sender: "user" | "system";
  text: string;
  audioUrl?: string;
};

type Props = {
  onProfileChange?: (
    profileId: string | null,
    profileName: string | null,
  ) => void;
  onNoMatch?: () => void;
};

export default function ProfileMatch({ onProfileChange, onNoMatch }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(
    null,
  );
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "system",
      text: "Welcome! Press the microphone to record your voice and sign in.",
    },
  ]);

  useEffect(() => {
    return () => {
      if (lastRecordingUrl) {
        URL.revokeObjectURL(lastRecordingUrl);
      }
      setPendingTranscript(null);
      setPendingMessage(null);
    };
  }, [lastRecordingUrl]);

  const addMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleTranscript = (transcript: string) => {
    setPendingTranscript(transcript);
  };

  const handleRecordingComplete = async (blob: Blob) => {
    setIsProcessing(true);
    setErrorMessage(null);

    if (lastRecordingUrl) {
      URL.revokeObjectURL(lastRecordingUrl);
      setLastRecordingUrl(null);
    }

    const audioUrl = URL.createObjectURL(blob);
    setLastRecordingUrl(audioUrl);

    const userMessage: ChatMessage = {
      sender: "user",
      text: pendingTranscript || "Voice recording",
      audioUrl: audioUrl,
    };
    setPendingMessage(userMessage);
    setPendingTranscript(null);

    try {
      await loadRecognizer();
      const audioBuffer = await blobToAudioBuffer(blob);
      const emb = await getEmbeddingFromAudioBuffer(audioBuffer);
      const match = await matchProfile(emb, MATCH_THRESHOLD);

      if (match.match && match.score >= MATCH_THRESHOLD) {
        setActiveProfileId(match.match.id);
        onProfileChange?.(match.match.id, match.match.name);
        addMessage(userMessage);
        addMessage({
          sender: "system",
          text: `Voice recognized. Signed in as ${match.match.name}.`,
        });
      } else {
        addMessage(userMessage);
        addMessage({
          sender: "system",
          text: "No matching voice profile found. Please create a new profile.",
        });
        onNoMatch?.();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Failed to process recording. Please try again or reload the page.",
      );
      addMessage(userMessage);
      addMessage({
        sender: "system",
        text: "There was a problem processing your voice. Try again.",
      });
    } finally {
      setIsProcessing(false);
      setPendingMessage(null);
    }
  };

  const handleSignOut = () => {
    setActiveProfileId(null);
    if (lastRecordingUrl) {
      URL.revokeObjectURL(lastRecordingUrl);
      setLastRecordingUrl(null);
    }
    setPendingTranscript(null);
    setPendingMessage(null);
    setErrorMessage(null);
    setMessages([]);
    onProfileChange?.(null, null);
  };

  return (
    <div className="grid gap-4 p-6 rounded-[28px] bg-slate-900 border border-white/10">
      <div className="flex justify-between items-center gap-4">
        {activeProfileId ? (
          <button
            onClick={handleSignOut}
            className="rounded-2xl bg-red-500 px-4 py-2 text-white hover:bg-red-400"
          >
            Sign Out
          </button>
        ) : null}
      </div>

      <div className="min-h-[320px] max-h-[440px] overflow-y-auto grid gap-3 p-5 rounded-[22px] bg-slate-950 border border-white/10">
        {messages.map((message, index) => {
          const bubbleClass =
            message.sender === "user"
              ? "self-end max-w-[85%] rounded-[20px] rounded-tl-[4px] bg-blue-600"
              : "self-start max-w-[85%] rounded-[20px] rounded-tr-[4px] bg-slate-800";

          return (
            <div
              key={index}
              className={`${bubbleClass} px-4 py-3 text-sm leading-6 text-white`}
            >
              {message.text}
              {message.audioUrl ? (
                <div className="mt-3 rounded-lg bg-slate-900 p-2">
                  <audio controls src={message.audioUrl} className="w-full" />
                </div>
              ) : null}
            </div>
          );
        })}

        {isProcessing && pendingMessage && (
          <div className="self-end max-w-[85%] rounded-[20px] rounded-tl-[4px] bg-blue-600/60 px-4 py-3 text-sm leading-6 text-white">
            {pendingMessage.text}
            {pendingMessage.audioUrl ? (
              <div className="mt-3 rounded-lg bg-slate-900 p-2">
                <audio
                  controls
                  src={pendingMessage.audioUrl}
                  className="w-full"
                />
              </div>
            ) : null}
          </div>
        )}

        {isProcessing && pendingMessage && (
          <div className="self-start max-w-[85%] rounded-[20px] rounded-tr-[4px] bg-slate-700/90 px-4 py-3 text-sm leading-6 text-slate-100 animate-pulse">
            Processing your voice...
          </div>
        )}

        {errorMessage && (
          <div className="self-start max-w-[85%] rounded-[20px] rounded-tr-[4px] border border-rose-700 bg-rose-950/95 px-4 py-3 text-sm leading-6 text-rose-100">
            {errorMessage}
          </div>
        )}
      </div>

      <Recorder
        onTranscript={handleTranscript}
        onRecordingComplete={handleRecordingComplete}
      />
    </div>
  );
}
