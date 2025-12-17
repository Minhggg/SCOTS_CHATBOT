"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SidebarHeader } from "./sidebar-header";
import { HistoryList } from "./history-list";
import { UserNav } from "./user-nav";

export function ChatSidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex flex-col h-full bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out hidden md:flex",
        isCollapsed ? "w-[60px]" : "w-[260px]"
      )}
    >
      {/* Phần 1: Header (Chat mới & Toggle) */}
      <SidebarHeader 
        isCollapsed={isCollapsed} 
        toggleSidebar={() => setIsCollapsed(!isCollapsed)} 
      />

      {/* Divider */}
      <div className="h-px bg-gray-800 mx-3 my-1" />

      {/* Phần 2: Danh sách lịch sử */}
      <HistoryList isCollapsed={isCollapsed} />

      {/* Divider */}
      <div className="h-px bg-gray-800 mx-3 my-1" />

      {/* Phần 3: User Info */}
      <div className="p-3 mt-auto">
        <UserNav isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}