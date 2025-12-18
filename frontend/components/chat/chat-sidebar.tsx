"use client";

import { MessageSquarePlus, LogOut, MessageCircle, MoreVertical, Pin, Trash2, Edit2 } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  getConversations, 
  pinConversation, 
  unpinConversation, 
  deleteConversation,
  renameConversation,
  ConversationItem 
} from "@/lib/miagent-api";
import { getUserInfo, clearAuth } from '@/lib/auth';

interface UserInfo {
  name: string;
  email: string;
}

interface ChatSidebarProps {
  installedAppId?: string;
  currentConversationId?: string;
  onConversationChange?: (conversationId: string | null) => void;
  onNewChat?: () => void;
  refreshTrigger?: number; // Increment this to trigger refresh
}

export function ChatSidebar({ 
  installedAppId, 
  currentConversationId,
  onConversationChange,
  onNewChat,
  refreshTrigger
}: ChatSidebarProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [pinnedConversations, setPinnedConversations] = useState<ConversationItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const info = getUserInfo();
    if (info) setUser(info);
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!installedAppId) return;

    setLoading(true);
    try {
      const [pinnedData, unpinnedData] = await Promise.all([
        getConversations(installedAppId, undefined, true, 100),
        getConversations(installedAppId, undefined, false, 100),
      ]);
      
      setPinnedConversations(pinnedData.data || []);
      setConversations(unpinnedData.data || []);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [installedAppId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Refresh when refreshTrigger changes (new conversation created)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && installedAppId) {
      // Delay refresh a bit to ensure backend has updated
      const timer = setTimeout(() => {
        loadConversations();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [refreshTrigger, installedAppId, loadConversations]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem("username");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("auth_provider");
    // Set flag để lần đăng nhập tiếp theo sẽ cho chọn tài khoản
    localStorage.setItem("force_account_selection", "true");
    router.push("/login");
  };

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      window.location.href = "/";
    }
  };

  const handleConversationClick = (conversationId: string) => {
    if (onConversationChange) {
      onConversationChange(conversationId);
    }
  };

  const handlePin = async (conversationId: string, isPinned: boolean) => {
    if (!installedAppId) return;
    
    try {
      if (isPinned) {
        await unpinConversation(installedAppId, conversationId);
        setPinnedConversations(prev => {
          const item = prev.find(c => c.id === conversationId);
          if (item) {
            setConversations(prevConv => [...prevConv, item]);
          }
          return prev.filter(c => c.id !== conversationId);
        });
      } else {
        await pinConversation(installedAppId, conversationId);
        setConversations(prev => {
          const item = prev.find(c => c.id === conversationId);
          if (item) {
            setPinnedConversations(prevPinned => [...prevPinned, item]);
          }
          return prev.filter(c => c.id !== conversationId);
        });
      }
      setShowMenu(null);
    } catch (error: any) {
      console.error("Error pinning conversation:", error);
    }
  };

  const handleDelete = async (conversationId: string) => {
    if (!installedAppId) return;
    if (!confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) return;
    
    try {
      await deleteConversation(installedAppId, conversationId);
      setPinnedConversations(prev => prev.filter(c => c.id !== conversationId));
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        if (onConversationChange) {
          onConversationChange(null);
        }
      }
      setShowMenu(null);
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleRename = async (conversationId: string, newName: string) => {
    if (!installedAppId || !newName.trim()) return;
    
    try {
      await renameConversation(installedAppId, conversationId, newName.trim());
      
      const updateConversation = (list: ConversationItem[]) =>
        list.map(c => c.id === conversationId ? { ...c, name: newName.trim() } : c);
      
      setPinnedConversations(updateConversation);
      setConversations(updateConversation);
      setEditingId(null);
      setEditingName("");
      setShowMenu(null);
    } catch (error: any) {
      console.error("Error renaming conversation:", error);
    }
  };

  const stripEmojis = (text?: string) => 
    text?.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '') || '';

  const renderConversationItem = (item: ConversationItem, isPinned: boolean) => {
    const isActive = currentConversationId === item.id;
    const isHovered = hoveredItem === item.id;
    const showMenuForThis = showMenu === item.id;
    const isEditing = editingId === item.id;

    return (
      <div
        key={item.id}
        className={`
          flex items-center mb-1 py-1.5 px-3 text-sm rounded-lg cursor-pointer group
          ${isActive ? 'bg-blue-50 text-blue-700' : 'text-white hover:bg-gray-50 hover:text-black'}
        `}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={() => !isEditing && handleConversationClick(item.id)}
      >
        <MessageCircle className={`shrink-0 mr-2 w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
        
        {isEditing ? (
          <input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={() => {
              if (editingName.trim()) {
                handleRename(item.id, editingName);
              } else {
                setEditingId(null);
                setEditingName("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editingName.trim()) {
                  handleRename(item.id, editingName);
                }
              } else if (e.key === 'Escape') {
                setEditingId(null);
                setEditingName("");
              }
            }}
            className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="flex-1 truncate" title={stripEmojis(item.name)}>
              {stripEmojis(item.name) || "Cuộc trò chuyện mới"}
            </div>
            
            {item.id && (isHovered || showMenuForThis) && (
              <div className="shrink-0 relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowMenu(showMenuForThis ? null : item.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <MoreVertical className="w-2 h-2 text-gray-500" />
                </button>
                
                {showMenuForThis && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditingName(item.name);
                        setShowMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Đổi tên
                    </button>
                    <button
                      onClick={() => handlePin(item.id, isPinned)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pin className="w-4 h-4" />
                      {isPinned ? "Bỏ ghim" : "Ghim"}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-[260px] h-full bg-gray-900 text-gray-200 flex flex-col border-r border-gray-800 hidden md:flex">
      {/* New Chat Button */}
      <div className="p-4">
        <button 
          onClick={handleNewChat}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white w-full px-4 py-3 rounded-full transition-all text-sm font-medium shadow-sm border border-gray-700"
        >
          <MessageSquarePlus size={18} />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 scrollbar-hide">
        {loading ? (
          <div className="text-center text-gray-500 text-sm py-4">Đang tải...</div>
        ) : (
          <>
            {pinnedConversations.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 mb-2 px-2 mt-2">Đã ghim</div>
                {pinnedConversations.map(item => renderConversationItem(item, true))}
              </div>
            )}
            
            {conversations.length > 0 && (
              <div>
                {pinnedConversations.length > 0 && (
                  <div className="text-xs font-semibold text-white mb-2 px-2 mt-2">Gần đây</div>
                )}
                {conversations.map(item => renderConversationItem(item, false))}
              </div>
            )}
            
            {!loading && pinnedConversations.length === 0 && conversations.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4 px-2">
                Chưa có cuộc trò chuyện nào
              </div>
            )}
          </>
        )}
      </div>
      
      {/* User & Logout Area */}
      <div className="p-4 border-t border-gray-800">
        {user ? (
          <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-all">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm font-medium truncate w-24" title={user.email}>
                {user.name}
              </div>
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