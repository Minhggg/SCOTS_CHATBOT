"use client";

import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils"; // Hoặc đường dẫn utils của bạn

interface SidebarHeaderProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export function SidebarHeader({ isCollapsed, toggleSidebar }: SidebarHeaderProps) {
  return (
    <div className={cn("flex items-center p-3", isCollapsed ? "justify-center flex-col gap-4" : "justify-between")}>
      {/* Nút Chat mới */}
      <button
        className={cn(
          "flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all border border-gray-700 shadow-sm",
          isCollapsed ? "h-10 w-10 justify-center p-0 rounded-full" : "flex-1 px-3 py-2.5"
        )}
        title="Cuộc trò chuyện mới"
      >
        <MessageSquarePlus size={18} />
        {!isCollapsed && <span className="text-sm font-medium">Chat mới</span>}
      </button>

      {/* Nút Toggle Đóng/Mở */}
      <button
        onClick={toggleSidebar}
        className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-800 transition-colors"
        title={isCollapsed ? "Mở sidebar" : "Đóng sidebar"}
      >
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>
    </div>
  );
}