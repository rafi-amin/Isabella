
"use client";

import { useState, useCallback, useEffect } from "react";

export interface UseSpeechSynthesisReturn {
  speak: (text: string, lang?: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  error: string | null;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
    }
  }, []);

  const speak = useCallback((text: string, lang: string = "en-US") => {
    if (!isSupported) {
      setError("Speech synthesis not supported by this browser.");
      return;
    }
    if (isSpeaking) {
      // Optionally cancel current speech or queue, for now, just log
      console.warn("Speech synthesis is already active.");
      // return; 
      // Allow interrupting speech:
      window.speechSynthesis.cancel();
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setError(null);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (e instanceof Error) {
        setError(`Error starting speech synthesis: ${e.message}`);
      } else {
        setError("Unknown error starting speech synthesis.");
      }
      setIsSpeaking(false);
    }
  }, [isSupported, isSpeaking]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);
  
  useEffect(() => {
    // Cleanup: cancel speech synthesis if component unmounts while speaking
    return () => {
      if (isSpeaking) {
        cancel();
      }
    };
  }, [isSpeaking, cancel]);


  return { speak, cancel, isSpeaking, isSupported, error };
}
