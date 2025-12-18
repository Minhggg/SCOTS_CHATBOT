"use client";

import { Message } from "@/types";
import { User } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { ImageGallery } from "@/components/image-gallery";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Get image URLs from message_files
  const imgSrcs = message.message_files?.length
    ? message.message_files
        .filter((file) => file.type === 'image')
        .map((file) => file.url)
    : [];

  if (isUser) {
    // Question (User message) - align right, similar to aht-miagent
    return (
      <div className="flex justify-end mb-2 last:mb-0 pl-10">
        <div className="group relative mr-4">
          <div className="px-4 py-3 bg-[#EEEEEE] rounded-2xl text-sm text-black">
            {imgSrcs.length > 0 && <ImageGallery srcs={imgSrcs} />}
            <Markdown content={message.content} isQuestion={true} />
          </div>
          <div className="mt-1 h-[18px]" />
        </div>
        <div className="shrink-0 w-10 h-10">
          <div className="w-full h-full rounded-full border-[0.5px] border-black/5 flex items-center justify-center bg-blue-500 text-white">
            <User size={18} />
          </div>
        </div>
      </div>
    );
  }

  // Answer (Assistant message) - align left, similar to aht-miagent
  return (
    <div className="flex mb-2 last:mb-0">
      <div className="shrink-0 relative w-10 h-10">
        <div className="flex items-center justify-center w-full h-full rounded-full overflow-hidden bg-[#d5f5f6] border-none text-xl">
          <img
            src="/avatar.png"
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback nếu không có avatar.png
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-600 text-xs font-bold">AI</div>';
              }
            }}
          />
        </div>
      </div>
      <div className="chat-answer-container group grow w-0 ml-4">
        <div className="group relative pr-4">
          <div className="relative inline-block px-4 py-3 max-w-full bg-[#FBFBFB] rounded-b-2xl rounded-t-2xl text-sm text-black">
            {imgSrcs.length > 0 && <ImageGallery srcs={imgSrcs} />}
            <Markdown content={message.content} className="!text-black" />
          </div>
        </div>
      </div>
    </div>
  );
}
