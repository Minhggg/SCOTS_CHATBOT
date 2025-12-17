"use client"

import * as React from "react"
import { useState } from "react"
// import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatSidebar } from "@/components/sidebar/index";
import { ChatList, Message } from "@/components/chat/chat-list"
import { PromptBox } from "@/components/chat/prompt-box"

// Mở rộng kiểu Message để hỗ trợ hiển thị ảnh trong ChatList (nếu cần)
interface ExtendedMessage extends Message {
  image?: string | null;
}

export default function Home() {
  // --- 1. STATE MANAGEMENT ---
  const [messages, setMessages] = useState<ExtendedMessage[]>([])
  
  // State cho Text Input
  const [input, setInput] = useState("")
  
  // State cho Ảnh (Lưu URL preview để hiển thị và File để upload API sau này)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  // --- 2. HANDLER: Gửi tin nhắn ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Chặn gửi nếu rỗng (không text VÀ không ảnh) hoặc đang loading
    if ((!input.trim() && !selectedImage) || isLoading) return

    // 2.1. Tạo tin nhắn User (Hiển thị lên UI ngay lập tức)
    const userMessage: ExtendedMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      image: selectedImage, // Lưu ảnh vào tin nhắn để hiện trong lịch sử chat
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    
    // 2.2. RESET FORM (Quan trọng: Xóa cả text và ảnh sau khi gửi)
    setInput("")
    setSelectedImage(null)
    setSelectedFile(null)
    
    setIsLoading(true)

    try {
      // 2.3. Gọi API (Logic cũ)
      // Lưu ý: Nếu muốn gửi ảnh lên Server, bạn cần chuyển sang dùng FormData thay vì JSON
      const response = await fetch("http://localhost:8000/api/v1/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Hiện tại chỉ gửi text lên server demo
        body: JSON.stringify({ message: userMessage.content }),
      })

      if (!response.ok) throw new Error("Network response was not ok")

      const data = await response.json()

      // 2.4. Tạo tin nhắn phản hồi từ Bot
      const botMessage: ExtendedMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error fetching chat:", error)
      const errorMessage: ExtendedMessage = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // --- 3. RENDER UI ---
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* A. LEFT SIDEBAR */}
      <ChatSidebar />

      {/* B. RIGHT CHAT AREA */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b px-6 py-3 bg-white/50 dark:bg-[#303030]/50 backdrop-blur-sm z-10">
          <h2 className="text-lg font-semibold text-foreground">Gemini Clone</h2>
        </header>

        {/* Chat List (Khu vực hiển thị tin nhắn) */}
        <div className="flex-1 w-full overflow-hidden relative flex flex-col">
           <div className="flex-1 w-full h-full">
              <ChatList messages={messages} isLoading={isLoading} />
           </div>
        </div>

        {/* Input Area (Khu vực nhập liệu) */}
        <div className="w-full p-4 pt-0">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative w-full">
              
              {/* COMPONENT PROMPT BOX */}
              <PromptBox 
                // Truyền Text State
                value={input}
                onChange={(e) => setInput(e.target.value)}
                
                // Truyền Image State (Quan trọng để PromptBox hiển thị ảnh từ Page)
                imageSrc={selectedImage}
                onImageChange={(file, previewUrl) => {
                  setSelectedFile(file)
                  setSelectedImage(previewUrl)
                }}

                // Xử lý phím Enter để gửi
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
            </form>

            <div className="text-center text-xs text-muted-foreground mt-2 opacity-70">
              Gemini Clone có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}