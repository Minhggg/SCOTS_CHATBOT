"use client"

import * as React from "react"
import { Bot, User } from "lucide-react"

// --- Utility ---
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

// --- Types ---
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  image?: string | null; // <-- MỚI: Thêm trường ảnh (tùy chọn)
  createdAt?: Date
}

interface ChatListProps {
  messages: Message[]
  isLoading?: boolean
}

// --- 1. Sub-component: Avatar ---
const SimpleAvatar = ({ isUser }: { isUser: boolean }) => {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm overflow-hidden",
        isUser ? "bg-black text-white dark:bg-white dark:text-black" : "bg-green-600 text-white"
      )}
    >
      {isUser ? <User size={16} /> : <Bot size={16} />}
    </div>
  )
}

// --- 2. Sub-component: ChatBubble ---
function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  // Style cho khối bong bóng
  const bubbleClass = cn(
    "relative px-4 py-3 text-sm shadow-sm max-w-full overflow-hidden", // Thêm overflow-hidden để ảnh bo góc đẹp
    "rounded-2xl", 
    isUser
      ? "bg-black text-white rounded-tr-sm dark:bg-white dark:text-black"
      : "bg-gray-100 text-gray-900 rounded-tl-sm border dark:bg-[#303030] dark:text-gray-100 dark:border-none"
  )

  return (
    <div className={cn("flex w-full gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className="flex flex-col items-center pt-1"> 
         <SimpleAvatar isUser={isUser} />
      </div>

      <div className={cn("flex max-w-[75%] flex-col", isUser ? "items-end" : "items-start")}>
        <div className={bubbleClass}>
          
          {/* --- KHU VỰC HIỂN THỊ ẢNH (MỚI) --- */}
          {message.image && (
            <div className="mb-2 rounded-lg overflow-hidden">
              <img 
                src={message.image} 
                alt="attachment" 
                className="max-h-[300px] w-auto object-cover rounded-lg" // Giới hạn chiều cao ảnh
                loading="lazy"
              />
            </div>
          )}

          {/* Nội dung Text */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          )}
        </div>

        {/* Thời gian */}
        {message.createdAt && (
          <span className="mt-1 px-1 text-[10px] text-gray-400">
            {message.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  )
}

// --- 3. Sub-component: TypingIndicator ---
function TypingIndicator() {
  return (
    <div className="flex w-full gap-3">
      <div className="pt-1">
         <SimpleAvatar isUser={false} />
      </div>
      <div className="bg-gray-100 border dark:bg-[#303030] dark:border-none rounded-2xl rounded-tl-sm px-4 py-4 flex items-center gap-1 h-10">
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
      </div>
    </div>
  )
}

// --- 4. Main Component: ChatList ---
export function ChatList({ messages = [], isLoading }: ChatListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới hoặc đang loading
  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4 p-8 text-center opacity-60">
        <div className="p-4 bg-gray-50 rounded-full dark:bg-gray-800">
            <Bot size={64} strokeWidth={1.5} />
        </div>
        <div className="max-w-xs">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-200">Xin chào!</p>
          <p className="text-sm mt-1">Tôi có thể giúp gì cho bạn hôm nay?</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto h-full no-scrollbar pb-4">
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
      
      {isLoading && <TypingIndicator />}
      
      {/* Element để scroll tới */}
      <div ref={scrollRef} className="h-px w-full" />
    </div>
  )
}