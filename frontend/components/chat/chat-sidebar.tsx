"use client";

import { MessageSquarePlus, MessageSquare, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ChatSidebar() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);

  // Kiểm tra đăng nhập khi component load
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (!storedUser) {
      // Nếu chưa login thì ẩn hoặc redirect (tuỳ logic)
      // router.push("/login"); 
    } else {
      setUser(storedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const history = [
    { id: '1', title: 'Lịch sử chat mẫu 1' },
    { id: '2', title: 'Lịch sử chat mẫu 2' },
  ];

  return (
    <div className="w-[260px] h-full bg-gray-900 text-gray-200 flex flex-col border-r border-gray-800 hidden md:flex">
      {/* New Chat Button */}
      <div className="p-4">
        <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white w-full px-4 py-3 rounded-full transition-all text-sm font-medium shadow-sm border border-gray-700">
          <MessageSquarePlus size={18} />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        <div className="text-xs font-semibold text-gray-500 mb-2 px-2 mt-2">Gần đây</div>
        {history.map((item) => (
          <button
            key={item.id}
            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors text-left text-sm group"
          >
            <MessageSquare size={16} className="text-gray-400 group-hover:text-white" />
            <span className="truncate flex-1">{item.title}</span>
          </button>
        ))}
      </div>
      
      {/* User & Logout Area */}
      <div className="p-4 border-t border-gray-800">
        {user ? (
          <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-all">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {user.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm font-medium truncate w-24">{user}</div>
            </div>
            <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 p-1" 
                title="Đăng xuất"
            >
                <LogOut size={16} />
            </button>
          </div>
        ) : (
            <button 
                onClick={() => router.push("/login")}
                className="w-full py-2 text-sm bg-blue-600 rounded hover:bg-blue-700"
            >
                Đăng nhập
            </button>
        )}
      </div>
    </div>
  );
}