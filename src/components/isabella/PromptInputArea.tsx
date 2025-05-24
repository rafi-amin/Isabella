
"use client";

import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Mic, Sparkles, Loader2 } from "lucide-react";

interface PromptInputAreaProps {
  onSuggestionClick: (suggestion: string) => void;
  onMicClick: () => void;
  assistantStatus: "idle" | "permission_pending" | "listening" | "transcribing" | "processing_command" | "speaking" | "error";
  isProcessing: boolean;
}

const suggestions = [
  "Tell me what you can do",
  "Help me plan",
  "Research a topic",
  "Help me write",
];

export const PromptInputArea: FC<PromptInputAreaProps> = ({
  onSuggestionClick,
  onMicClick,
  assistantStatus,
  isProcessing,
}) => {
  const micIcon = () => {
    if (assistantStatus === "listening" || assistantStatus === "speaking" ) {
      return <Mic className="h-5 w-5 text-primary" />; // Could be different color/icon if speaking
    }
    if (isProcessing || assistantStatus === "transcribing" || assistantStatus === "processing_command") {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return <Mic className="h-5 w-5" />;
  };
  
  const micButtonDisabled = isProcessing || assistantStatus === "transcribing" || assistantStatus === "processing_command" || assistantStatus === "permission_pending";

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-2 flex flex-col items-center">
      {/* Suggestion Chips */}
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {suggestions.map((text) => (
          <Button
            key={text}
            variant="outline"
            size="sm"
            className="bg-card/50 hover:bg-card/70 border-border/50 backdrop-blur-sm rounded-full text-xs h-auto py-1.5 px-3"
            onClick={() => onSuggestionClick(text)}
          >
            {text}
          </Button>
        ))}
      </div>

      {/* Main Input Bar */}
      <div className="w-full bg-card/70 backdrop-blur-sm border border-input/50 rounded-full p-2.5 flex items-center space-x-3 shadow-md">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/50">
          <Plus className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full text-sm hover:bg-muted/50 px-3 py-1 h-auto">
          Research
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full text-sm hover:bg-muted/50 px-3 py-1 h-auto">
          Canvas
        </Button>

        <div className="flex-grow text-left ml-2">
          <span className="text-muted-foreground text-sm">Ask Isabella</span>
        </div>
        
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/50" onClick={onMicClick} disabled={micButtonDisabled}>
          {micIcon()}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-muted/30 hover:bg-muted/60">
          <Sparkles className="h-5 w-5 text-primary" />
        </Button>
      </div>
    </div>
  );
};
