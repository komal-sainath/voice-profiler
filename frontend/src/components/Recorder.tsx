// frontend/src/components/Recorder.tsx
import { useRef, useState } from "react";

type Props = {
  onRecordingComplete: (blob: Blob) => void;
};

export default function Recorder({ onRecordingComplete }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob);
        // cleanup tracks
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone permission denied or unavailable.");
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={start} disabled={isRecording}>
        Start
      </button>
      <button onClick={stop} disabled={!isRecording}>
        Stop
      </button>
    </div>
  );
}
