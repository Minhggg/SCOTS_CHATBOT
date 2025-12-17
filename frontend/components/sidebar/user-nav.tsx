"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserNavProps {
  isCollapsed: boolean;
}

export function UserNav({ isCollapsed }: UserNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    // Logic check login từ localStorage
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  // Chưa đăng nhập
  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className={cn(
          "flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 transition-all text-white",
          isCollapsed ? "h-10 w-10 p-0" : "w-full py-2 px-4 gap-2"
        )}
        title="Đăng nhập"
      >
        <UserIcon size={18} />
        {!isCollapsed && <span className="text-sm font-medium">Đăng nhập</span>}
      </button>
    );
  }

  // Đã đăng nhập
  return (
    <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
      {/* Avatar */}
      <div className="w-8 h-8 min-w-[32px] bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
        {user.charAt(0).toUpperCase()}
      </div>

      {/* Info & Logout */}
      {!isCollapsed && (
        <div className="flex flex-1 items-center justify-between overflow-hidden">
          <span className="truncate text-sm font-medium text-gray-200">{user}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 p-1.5 rounded-md hover:bg-gray-800 transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </div>
  );
}