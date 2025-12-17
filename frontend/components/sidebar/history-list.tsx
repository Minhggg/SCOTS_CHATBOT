"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryListProps {
  isCollapsed: boolean;
}

export function HistoryList({ isCollapsed }: HistoryListProps) {
  // Mock data - Sau này bạn thay bằng API
  const history = [
    { id: '1', title: 'Lập trình ReactJS cơ bản' },
    { id: '2', title: 'Cách nấu món phở bò' },
    { id: '3', title: 'Review code Next.js' },
    { id: '4', title: 'Tư vấn mua Laptop' },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-1">
      {!isCollapsed && (
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Gần đây
        </div>
      )}
      
      {history.map((item) => (
        <button
          key={item.id}
          title={item.title}
          className={cn(
            "flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors text-left group relative",
            isCollapsed ? "justify-center px-2" : "px-3 mx-1 w-[calc(100%-8px)]"
          )}
        >
          <MessageSquare size={18} className="text-gray-400 group-hover:text-white shrink-0" />
          
          {!isCollapsed && (
            <span className="truncate text-sm text-gray-300 group-hover:text-white transition-colors">
              {item.title}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}