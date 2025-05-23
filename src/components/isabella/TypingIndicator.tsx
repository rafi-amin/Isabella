
"use client";

import type { FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

export const TypingIndicator: FC = () => {
  return (
    <div className={`flex items-end gap-3 justify-start`}>
      <Avatar className="h-10 w-10 shadow-sm">
        <AvatarImage src="/isabella-avatar.png" alt="Isabella Avatar" data-ai-hint="logo assistant" />
        <AvatarFallback>
          <Bot className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div
        className={`max-w-min rounded-xl p-3 shadow-md bg-card text-card-foreground rounded-bl-none border border-border/70 backdrop-blur-sm bg-opacity-80`}
      >
        <div className="flex items-center space-x-1.5"> {/* Increased space for better visual separation */}
          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-typing-dot animation-delay-0"></span>
          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-typing-dot animation-delay-200"></span>
          <span className="h-2 w-2 bg-muted-foreground rounded-full animate-typing-dot animation-delay-400"></span>
        </div>
      </div>
    </div>
  );
};
