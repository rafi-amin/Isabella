
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { transcribeSpeech, TranscribeSpeechInput } from "@/ai/flows/transcribe-speech";
import { processSpokenCommand, ProcessSpokenCommandInput, ProcessSpokenCommandOutput } from "@/ai/flows/process-command";
import { useAudioRecorder, AudioRecorderStatus } from "@/hooks/useAudioRecorder";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useToast } from "@/hooks/use-toast";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button"; // Added for Mic Button
import { Mic } from "lucide-react"; // Added for Mic Button
import { ChatBubble, ChatMessage } from "@/components/isabella/ChatBubble";
import { TaskList, TaskItem } from "@/components/isabella/TaskList";
import Image from "next/image";


type AssistantStatus =
  | "idle"
  | "permission_pending"
  | "listening"
  | "transcribing"
  | "processing_command"
  | "speaking"
  | "error";

const blobToDataURI = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function IsabellaPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      sender: "isabella",
      text: "Hello! I'm Isabella. How can I help you today? Tap the microphone to get started.",
      timestamp: new Date(),
    },
  ]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus>("idle");

  const { toast } = useToast();
  const audioRecorder = useAudioRecorder();
  const speechSynthesis = useSpeechSynthesis();

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force dark theme
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (audioRecorder.status === "permission_pending") setAssistantStatus("permission_pending");
    else if (audioRecorder.status === "recording") setAssistantStatus("listening");
    else if (audioRecorder.status === "error") {
      setAssistantStatus("error");
      toast({ title: "Microphone Error", description: audioRecorder.error || "Could not access microphone.", variant: "destructive" });
    }
  }, [audioRecorder.status, audioRecorder.error, toast]);

  useEffect(() => {
    if (speechSynthesis.error) {
      toast({ title: "Speech Error", description: speechSynthesis.error, variant: "destructive" });
      setAssistantStatus("idle");
    }
  }, [speechSynthesis.error, toast]);
  
  useEffect(() => {
    if (assistantStatus === 'speaking' && !speechSynthesis.isSpeaking && messages[messages.length -1]?.sender === 'isabella') {
      setAssistantStatus("idle");
    }
  }, [speechSynthesis.isSpeaking, assistantStatus, messages]);


  const transcribeMutation = useMutation({
    mutationFn: async (input: TranscribeSpeechInput) => transcribeSpeech(input),
    onSuccess: (data) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "user",
        text: data.transcription,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setAssistantStatus("processing_command");
      processCommandMutation.mutate({ spokenCommand: data.transcription });
    },
    onError: (error) => {
      toast({ title: "Transcription Error", description: error.message, variant: "destructive" });
      setAssistantStatus("error");
    },
  });

  const processCommandMutation = useMutation({
    mutationFn: async (input: ProcessSpokenCommandInput) => processSpokenCommand(input),
    onSuccess: (data: ProcessSpokenCommandOutput) => {
      const isabellaResponse: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "isabella",
        text: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, isabellaResponse]);
      
      if (speechSynthesis.isSupported) {
        setAssistantStatus("speaking");
        speechSynthesis.speak(data.response);
      } else {
        toast({ title: "Speech Output Not Supported", description: "Your browser does not support speech synthesis.", variant: "destructive"});
        setAssistantStatus("idle");
      }

      if (data.action === "task_scheduled" || data.response.toLowerCase().includes("reminder set") || data.response.toLowerCase().includes("task added")) {
        const newTaskText = data.response.substring(data.response.toLowerCase().indexOf(":") + 1).trim() || data.response;
        setTasks((prevTasks) => [
          ...prevTasks,
          { id: crypto.randomUUID(), text: newTaskText, completed: false },
        ]);
        toast({ title: "Reminder Set", description: `Added: ${newTaskText.substring(0,50)}...`, className: "bg-accent text-accent-foreground"});
      } else if (data.action?.toLowerCase().includes("error")) {
         toast({ title: "Isabella Says", description: data.response, variant: "destructive" });
      }
    },
    onError: (error) => {
      toast({ title: "Command Processing Error", description: error.message, variant: "destructive" });
      const errorResponse: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "isabella",
        text: "I encountered an issue processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
      setAssistantStatus("error");
    },
  });

  useEffect(() => {
    if (audioRecorder.status === "stopped" && audioRecorder.audioBlob) {
      setAssistantStatus("transcribing");
      blobToDataURI(audioRecorder.audioBlob)
        .then((audioDataUri) => {
          transcribeMutation.mutate({ audioDataUri });
        })
        .catch((err) => {
          toast({ title: "Audio Processing Error", description: "Failed to process audio data.", variant: "destructive" });
          setAssistantStatus("error");
        });
      audioRecorder.reset(); 
    }
  }, [audioRecorder.status, audioRecorder.audioBlob, audioRecorder, transcribeMutation, toast]);


  const handleMicButtonClick = useCallback(() => {
    if (assistantStatus === "listening") {
      audioRecorder.stopRecording();
    } else if (["idle", "error"].includes(assistantStatus)) {
      audioRecorder.startRecording();
    } else if (assistantStatus === "speaking") {
      speechSynthesis.cancel(); 
      setAssistantStatus("idle");
    }
  }, [assistantStatus, audioRecorder, speechSynthesis]);

  const getButtonState = () => {
    if (assistantStatus === "listening") {
      return { buttonClass: "bg-destructive hover:bg-destructive/90", iconClass: "text-destructive-foreground", label: "Listening...", ariaLabel: "Stop recording", labelClass: "text-destructive" };
    }
    if (assistantStatus === "speaking") {
      return { buttonClass: "bg-accent hover:bg-accent/90", iconClass: "text-accent-foreground", label: "Isabella is speaking...", ariaLabel: "Stop speaking", labelClass: "text-accent" };
    }
    if (isProcessing || assistantStatus === "transcribing" || assistantStatus === "processing_command") {
      // Using Mic icon with animate-spin for processing state
      return { buttonClass: "bg-muted hover:bg-muted/90", iconClass: "text-muted-foreground animate-spin", label: "Processing...", ariaLabel: "Processing, please wait", labelClass: "text-muted-foreground" };
    }
    if (assistantStatus === "error") {
      return { buttonClass: "bg-destructive hover:bg-destructive/90", iconClass: "text-destructive-foreground", label: "Error! Tap to retry.", ariaLabel: "Retry recording", labelClass: "text-destructive" };
    }
    // Idle state
    return { buttonClass: "bg-mic-gradient hover:brightness-110", iconClass: "text-primary-foreground", label: "Tap to Speak", ariaLabel: "Start recording", labelClass: `font-ibm-plex-sans animate-gradient-subtitle` };
  };

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({ title: "Reminder Deleted", description: "The reminder has been removed."});
  };
  
  const isProcessing = transcribeMutation.isPending || processCommandMutation.isPending;

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-4 md:p-8 bg-transparent text-foreground">
      <main className="container mx-auto max-w-3xl w-full flex flex-col flex-grow">
        <header className="text-center my-6 md:my-8">
          <h1 className="text-5xl md:text-6xl font-bold text-glow-effect font-playfair">
            Isabella
          </h1>
          <p className="text-lg animate-gradient-subtitle font-lora mt-2">Your Personal AI Assistant</p>
        </header>

        <Card className="flex-grow flex flex-col shadow-xl overflow-hidden mb-6 bg-card/80 backdrop-blur-sm border-border/50">
          <ScrollArea className="flex-grow p-4 md:p-6" ref={chatContainerRef}>
            <div className="space-y-6">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
               {(transcribeMutation.isPending || processCommandMutation.isPending) && messages[messages.length -1]?.sender === 'user' && (
                 <ChatBubble message={{id: 'thinking-indicator', sender: 'isabella', text: 'Thinking...', timestamp: new Date()}} />
                )}
            </div>
          </ScrollArea>
        </Card>
        
        {/* Mic Button and Label */}
        <div className="input-area flex flex-col items-center justify-center mb-6 py-4">
          <Button
            onClick={handleMicButtonClick}
            disabled={assistantStatus === "permission_pending" || transcribeMutation.isPending || processCommandMutation.isPending || assistantStatus === 'transcribing' || assistantStatus === 'processing_command'}
            className={`mic-button rounded-full h-20 w-20 p-4 shadow-2xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 
              ${isProcessing || assistantStatus === 'transcribing' || assistantStatus === 'processing_command' ? 'opacity-70 cursor-not-allowed' : ''} 
              ${getButtonState().buttonClass} 
              ${assistantStatus === 'listening' || assistantStatus === 'speaking' ? 'animate-pulse-mic' : ''}`}
            aria-label={getButtonState().ariaLabel}
          >
            <Mic className={`h-10 w-10 ${getButtonState().iconClass}`} />
          </Button>
          {assistantStatus !== "permission_pending" && (
            <p 
              className={`mt-3 text-sm text-center transition-opacity duration-300 
                ${isProcessing || assistantStatus === 'transcribing' || assistantStatus === 'processing_command' ? 'opacity-0' : 'opacity-100'}
                ${getButtonState().labelClass}`}
              style={{ minHeight: '1.25rem' }} // Prevents layout shift
            >
              {getButtonState().label}
            </p>
          )}
          {assistantStatus === "permission_pending" && (
             <p className="mt-3 text-sm text-center text-muted-foreground">Waiting for microphone permission...</p>
          )}
        </div>

        <div className="tasks-area w-full mt-4 mb-8">
          <TaskList tasks={tasks} onToggleTask={toggleTask} onDeleteTask={deleteTask} />
        </div>
      </main>
      <footer className="text-center text-xs text-foreground font-martian-mono py-4">
        Powered by RAFI_AMIN
      </footer>
    </div>
  );
}
