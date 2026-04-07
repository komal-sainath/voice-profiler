// frontend/src/components/Recorder.tsx
import { useEffect, useRef, useState } from "react";
import { FiMic, FiStopCircle } from "react-icons/fi";

type Props = {
  onRecordingComplete: (blob: Blob) => void;
  onTranscript?: (text: string) => void;
};

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function Recorder({ onRecordingComplete, onTranscript }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
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
        onRecordingComplete(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript?.trim();
          if (transcript) {
            onTranscript?.(transcript);
          }
        };
        recognitionRef.current.onerror = (event: any) => {
          console.warn("Speech recognition error:", event);
        };
        recognitionRef.current.start();
      }

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
    recognitionRef.current?.stop?.();
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
      recognitionRef.current?.stop?.();
      mediaRecorderRef.current?.stop?.();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={start}
          disabled={isRecording}
          className={`w-[60px] h-[60px] rounded-full border-none text-white grid place-items-center ${
            isRecording
              ? "bg-slate-600 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-500"
          }`}
        >
          <FiMic size={24} />
        </button>
        <button
          onClick={stop}
          disabled={!isRecording}
          className={`w-[60px] h-[60px] rounded-full border-none text-white grid place-items-center ${
            isRecording
              ? "bg-red-600 hover:bg-red-500 cursor-pointer"
              : "bg-slate-600 cursor-not-allowed"
          }`}
        >
          <FiStopCircle size={24} />
        </button>
      </div>
      {isRecording && (
        <div className="text-sky-300 text-sm">
          Recording {formatTime(elapsedSeconds)}
        </div>
      )}
    </div>
  );
}
