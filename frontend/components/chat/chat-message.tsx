import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex w-full gap-4 p-4 max-w-3xl mx-auto",
      // Nếu muốn highlight nền tin nhắn user thì uncomment dòng dưới
      // isUser ? "bg-gray-50" : "bg-transparent" 
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-blue-500 text-white" : "bg-green-500 text-white"
      )}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      
      <div className="flex-1 space-y-2">
        <p className="font-semibold text-sm text-gray-900">
          {isUser ? "Bạn" : "Gemini Clone"}
        </p>
        <div className="prose prose-sm text-gray-800 leading-relaxed">
           {/* Ở đây sau này có thể dùng ReactMarkdown để render markdown */}
           {message.content}
        </div>
      </div>
    </div>
  );
}