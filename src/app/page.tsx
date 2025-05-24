
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { transcribeSpeech, TranscribeSpeechInput } from "@/ai/flows/transcribe-speech";
import { processSpokenCommand, ProcessSpokenCommandInput, ProcessSpokenCommandOutput } from "@/ai/flows/process-command";
import { useAudioRecorder, AudioRecorderStatus } from "@/hooks/useAudioRecorder";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBubble, ChatMessage } from "@/components/isabella/ChatBubble";
// TypingIndicator import removed
import { TaskList, TaskItem } from "@/components/isabella/TaskList";
import { Mic, Loader2, Volume2, AlertTriangle, XCircle } from "lucide-react";
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
      text: "Hello! I'm Isabella. How can I help you today? Tap the microphone to speak.",
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
  }, [messages]); // assistantStatus dependency removed

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
      setAssistantStatus("idle"); // Or error if critical
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

      // Handle actions like scheduling tasks
      if (data.action === "task_scheduled" || data.response.toLowerCase().includes("reminder set") || data.response.toLowerCase().includes("task added")) {
        // Simple task addition based on response text. More robust parsing would be needed for complex tasks.
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
      audioRecorder.reset(); // Reset recorder after processing blob
    }
  }, [audioRecorder.status, audioRecorder.audioBlob, audioRecorder, transcribeMutation, toast]);


  const handleMicClick = useCallback(() => {
    if (assistantStatus === "listening") {
      audioRecorder.stopRecording();
    } else if (["idle", "error"].includes(assistantStatus)) {
      audioRecorder.startRecording();
    } else if (assistantStatus === "speaking") {
      speechSynthesis.cancel(); // Allow interrupting Isabella
      setAssistantStatus("idle");
    }
    // For other states, button might be disabled or have specific behavior.
  }, [assistantStatus, audioRecorder, speechSynthesis]);

  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({ title: "Reminder Deleted", description: "The reminder has been removed."});
  };

  const getButtonState = () => {
    const isLoading = transcribeMutation.isPending || processCommandMutation.isPending;
    const isDisabled = isLoading || ["permission_pending", "transcribing", "processing_command"].includes(assistantStatus);

    let icon = <Mic className="h-8 w-8" />;
    let label = "Tap to Speak";
    let buttonClass = "bg-mic-gradient hover:brightness-110 filter"; // Default gradient
    let pulse = false;

    switch (assistantStatus) {
      case "permission_pending":
        icon = <Loader2 className="h-8 w-8 animate-spin" />;
        label = "Mic Permission...";
        buttonClass = "bg-accent"; 
        break;
      case "listening":
        icon = <Mic className="h-8 w-8" />;
        label = "Listening... Tap to Stop";
        buttonClass = "bg-destructive hover:bg-destructive/90";
        pulse = true;
        break;
      case "transcribing":
      case "processing_command":
        icon = <Loader2 className="h-8 w-8 animate-spin text-accent-foreground" />;
        label = assistantStatus === "transcribing" ? "Transcribing..." : "Processing...";
        buttonClass = "bg-accent"; 
        break;
      case "speaking":
        icon = <Volume2 className="h-8 w-8" />;
        label = "Isabella Speaking... Tap to Stop";
        buttonClass = "bg-accent hover:bg-accent/90"; 
        break;
      case "error":
        icon = <XCircle className="h-8 w-8" />;
        label = "Error! Tap to Retry";
        buttonClass = "bg-destructive hover:bg-destructive/90";
        break;
      case "idle":
      default:
        // Default state (gradient) is already set for buttonClass
        break;
    }
    
    if (isLoading && assistantStatus !== "transcribing" && assistantStatus !== "processing_command") {
       icon = <Loader2 className="h-8 w-8 animate-spin" />;
       label = "Processing...";
       if (assistantStatus !== 'idle') buttonClass = "bg-accent"; 
    }


    return { icon, label, isDisabled, buttonClass, pulse };
  };

  const { icon, label, isDisabled, buttonClass, pulse } = getButtonState();
  const showLabelText = (!isDisabled || assistantStatus === "listening" || assistantStatus === "speaking" || assistantStatus === "error" || assistantStatus === "idle");

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
               {/* TypingIndicator removed, was here */}
               {(transcribeMutation.isPending || processCommandMutation.isPending) && messages[messages.length -1]?.sender === 'user' && (
                 <ChatBubble message={{id: 'thinking-indicator', sender: 'isabella', text: 'Thinking...', timestamp: new Date()}} />
                )}
            </div>
          </ScrollArea>
        </Card>
        
        <div className="input-area flex flex-col items-center justify-center mb-6 py-4">
          <Button
            onClick={handleMicClick}
            disabled={isDisabled && assistantStatus !== "listening" && assistantStatus !== "speaking"}
            className={`rounded-full h-20 w-20 md:h-24 md:w-24 flex flex-col items-center justify-center shadow-lg transition-all duration-300 ease-in-out focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${buttonClass} ${pulse ? 'animate-pulse-mic' : ''}`}
            aria-label={label}
          >
            {icon}
          </Button>
          <p className={`mt-3 text-sm h-5 font-ibm-plex-sans ${
              assistantStatus === "idle"
                ? "animate-gradient-subtitle" 
                : assistantStatus === "error"
                ? "text-destructive/90"
                : "text-muted-foreground"
            }`}
          >
            {showLabelText ? label : ""}
          </p>
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
