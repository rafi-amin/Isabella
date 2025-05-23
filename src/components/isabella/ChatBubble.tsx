
import type { FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

export interface ChatMessage {
  id: string;
  sender: "user" | "isabella";
  text: string;
  timestamp: Date;
}

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === "user";
  const timeAgo = formatDistanceToNow(message.timestamp, { addSuffix: true });

  return (
    <div className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 shadow-sm">
          {/* Updated placeholder to match new dark theme: Bright Magenta/Purple with Light Pink/White text */}
          <AvatarImage src="https://placehold.co/40x40/C653FF/FFF9FE.png" alt="Isabella Avatar" data-ai-hint="robot assistant" />
          <AvatarFallback>
            <Bot className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[70%] rounded-xl p-3 shadow-md ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground rounded-bl-none border border-border/70" 
        } backdrop-blur-sm bg-opacity-80`} 
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'}`}>
          {timeAgo}
        </p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shadow-sm">
           {/* Updated placeholder to match new dark theme: Bright Pink with Dark text */}
           <AvatarImage src="https://placehold.co/40x40/F56BFF/150F1F.png" alt="User Avatar" data-ai-hint="person silhouette" />
          <AvatarFallback>
            <User className="h-5 w-5 text-accent" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
