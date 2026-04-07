// frontend/src/components/Recorder.tsx
import { useEffect, useRef, useState } from "react";

type Props = {
  onRecordingComplete: (blob: Blob) => void;
};

export default function Recorder({ onRecordingComplete }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);

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
        setRecordedBlob(blob);
        onRecordingComplete(blob);
        // cleanup tracks
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setElapsedSeconds(0);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds((value) => value + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Microphone permission denied or unavailable.");
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.requestData();
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={start} disabled={isRecording}>
          Start
        </button>
        <button onClick={stop} disabled={!isRecording}>
          Stop
        </button>
        {isRecording && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "red",
                display: "inline-block",
              }}
            />
            <span style={{ fontWeight: 600 }}>
              Recording {formatTime(elapsedSeconds)}
            </span>
          </div>
        )}
      </div>
      {recordedBlob && (
        <div>
          <p>Recorded audio:</p>
          <audio controls src={URL.createObjectURL(recordedBlob)} />
        </div>
      )}
    </div>
  );
}
