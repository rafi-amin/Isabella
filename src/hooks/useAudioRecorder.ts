
"use client";

import { useState, useRef, useCallback } from "react";

export type AudioRecorderStatus = "idle" | "permission_pending" | "recording" | "stopped" | "error";

export interface UseAudioRecorderReturn {
  status: AudioRecorderStatus;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  audioBlob: Blob | null;
  error: string | null;
  reset: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<AudioRecorderStatus>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const reset = useCallback(() => {
    setStatus("idle");
    setAudioBlob(null);
    setError(null);
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    reset();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("MediaDevices API not supported.");
      setStatus("error");
      return;
    }

    try {
      setStatus("permission_pending");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const completeBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(completeBlob);
        setStatus("stopped");
        stream.getTracks().forEach(track => track.stop()); // Release microphone
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        setError(`MediaRecorder error: ${(event as any).error?.name || 'Unknown error'}`);
        setStatus("error");
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setStatus("recording");
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error getting microphone access: ${err.message}`);
      } else {
        setError("Unknown error getting microphone access.");
      }
      setStatus("error");
    }
  }, [reset]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      // Status will be set to 'stopped' by onstop handler
    }
  }, [status]);

  return { status, startRecording, stopRecording, audioBlob, error, reset };
}
