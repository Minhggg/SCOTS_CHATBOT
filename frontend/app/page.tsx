"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SendHorizontal, Bot } from "lucide-react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessage } from "@/components/chat/chat-message";
import { Message } from "@/types";

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 1. Thêm tin nhắn của User vào UI ngay lập tức
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Gọi API FastAPI
      const response = await fetch("http://localhost:8000/api/v1/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response, // Lấy dữ liệu từ Backend
        createdAt: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
       // ... xử lý lỗi
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* LEFT SIDEBAR */}
      <ChatSidebar />

      {/* RIGHT CHAT AREA */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header mobile (nếu cần) */}
        <header className="p-4 border-b md:hidden flex items-center justify-between">
            <span className="font-bold">Gemini Clone</span>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">Xin chào, tôi có thể giúp gì?</h1>
                </div>
            ) : (
                messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
            )}
            {isLoading && (
               <div className="max-w-3xl mx-auto p-4 flex gap-4">
                 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white"><Bot size={18}/></div>
                 <div className="animate-pulse text-gray-500">Đang suy nghĩ...</div>
               </div>
            )}
            <div ref={bottomRef} />
        </div>

        {/* Input Area (Sticky bottom) */}
        <div className="p-4 bg-white/80 backdrop-blur-md border-t">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="w-full p-4 pr-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900 placeholder:text-gray-400 shadow-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <SendHorizontal size={20} />
              </button>
            </form>
            <div className="text-center text-xs text-gray-400 mt-2">
               Gemini Clone có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}