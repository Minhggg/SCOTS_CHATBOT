"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SendHorizontal, Bot } from "lucide-react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessage } from "@/components/chat/chat-message";
import { Message } from "@/types";
import { 
  sendChatMessage, 
  getFirstInstalledChatApp, 
  getInstalledAppIdByDomain, 
  verifyInstalledAppId,
  getChatList,
  generationConversationName
} from "@/lib/miagent-api";
import { getToken } from '@/lib/auth';
import { ChatImageUploader } from "@/components/image-uploader/chat-image-uploader";
import { ImageList } from "@/components/image-uploader/image-list";
import { useImageFiles, useClipboardUploader, useDraggableUploader } from "@/components/image-uploader/hooks";
import { TransferMethod, type VisionSettings } from "@/components/image-uploader/types";

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [installedAppId, setInstalledAppId] = useState<string>("");
  const [appError, setAppError] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Image upload management
  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles();
  const { onPaste } = useClipboardUploader({ onUpload, visionConfig: { enabled: true, number_limits: 3, transfer_methods: [TransferMethod.local_file, TransferMethod.remote_url], image_file_size_limit: 5 }, files });
  const { onDragEnter, onDragLeave, onDragOver, onDrop, isDragActive } = useDraggableUploader<HTMLInputElement>({ onUpload, files, visionConfig: { enabled: true, number_limits: 3, transfer_methods: [TransferMethod.local_file, TransferMethod.remote_url], image_file_size_limit: 5 } });

  // Kiểm tra đăng nhập và lấy installed app
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const loadInstalledApp = async () => {
      // Ưu tiên 1: Lấy từ env variable (nhưng cần verify)
      const envAppId = process.env.NEXT_PUBLIC_MIAGENT_APP_ID;
      if (envAppId) {
        // Verify installed app ID trước khi sử dụng
        const { verifyInstalledAppId } = await import('@/lib/miagent-api');
        const isValid = await verifyInstalledAppId(envAppId);
        if (isValid) {
          setInstalledAppId(envAppId);
          return;
        } else {
          console.warn('Installed app ID from env is invalid, falling back to other methods');
        }
      }

      // Ưu tiên 2: Lấy từ domain/lookup API
      const domain = process.env.NEXT_PUBLIC_DOMAIN || (typeof window !== 'undefined' ? window.location.hostname : '');
      if (domain) {
        try {
          const installedAppId = await getInstalledAppIdByDomain(domain);
          if (installedAppId) {
            setInstalledAppId(installedAppId);
            localStorage.setItem('current_installed_app_id', installedAppId);
            return;
          }
        } catch (err: any) {
          console.warn('Domain lookup failed, falling back to installed apps list:', err.message);
        }
      }

      // Ưu tiên 3: Fallback - Tự động lấy installed app chat đầu tiên
      try {
        const app = await getFirstInstalledChatApp();
        if (app) {
          setInstalledAppId(app.id);
          localStorage.setItem('current_installed_app_id', app.id);
        } else {
          console.warn('No installed chat app found');
          setAppError("Không tìm thấy app chat nào. Vui lòng cài đặt app chat trong aht-miagent trước.");
        }
      } catch (err: any) {
        console.error('Error fetching installed apps:', err);
        setAppError(`Lỗi khi lấy danh sách app: ${err.message}`);
      }
    };

    loadInstalledApp();
  }, [router]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!installedAppId || !conversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const chatList = await getChatList(installedAppId, conversationId);
        const loadedMessages: Message[] = [];
        
        chatList.data.forEach((item) => {
          // User message (question)
          loadedMessages.push({
            id: `question-${item.id}`,
            role: 'user',
            content: item.query,
            createdAt: new Date(item.created_at * 1000),
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'user') || [],
          });
          // Assistant message (answer)
          loadedMessages.push({
            id: item.id,
            role: 'assistant',
            content: item.answer,
            createdAt: new Date(item.created_at * 1000),
            message_files: item.message_files?.filter((file: any) => file.belongs_to === 'assistant') || [],
          });
        });
        
        setMessages(loadedMessages);
      } catch (error: any) {
        console.error("Error loading messages:", error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [installedAppId, conversationId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto focus input
  useEffect(() => {
    // Focus input khi component mount hoặc khi conversation thay đổi
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [conversationId, installedAppId]);

  // Focus input sau khi gửi message
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      // Delay một chút để đảm bảo UI đã update
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleConversationChange = (newConversationId: string | null) => {
    setConversationId(newConversationId || undefined);
    if (!newConversationId) {
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    setConversationId(undefined);
    setMessages([]);
    setInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) {
      return;
    }
    
    if (!installedAppId || installedAppId.trim() === '') {
      setAppError("Chưa có app chat. Vui lòng đợi hoặc cấu hình NEXT_PUBLIC_MIAGENT_APP_ID trong file .env.local");
      return;
    }

    // Check if images are still uploading
    if (files.find((item) => item.type === TransferMethod.local_file && !item.fileId && item.progress !== 100)) {
      setAppError("Vui lòng đợi ảnh tải lên xong");
      return;
    }

    const currentFiles = files.filter((file) => file.progress !== -1 && file.progress === 100);
    
    // Thêm tin nhắn user vào UI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      createdAt: new Date(),
      message_files: currentFiles.map((fileItem) => ({
        type: 'image' as const,
        url: fileItem.url || fileItem.base64Url || '',
        belongs_to: 'user' as const,
        transfer_method: fileItem.type,
        upload_file_id: fileItem.fileId,
      })),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
      setInput("");
      setIsLoading(true);
      setAppError("");
      onClear(); // Clear images after sending

      try {
      
      // Verify installed app ID trước khi gửi message
      const isValid = await verifyInstalledAppId(installedAppId);
      if (!isValid) {
        throw new Error(`Installed app ID không hợp lệ: ${installedAppId}. Đang tìm lại installed app...`);
      }
      
      // Convert image files to format expected by API
      const visionFiles = currentFiles.map((fileItem) => ({
        type: 'image' as const,
        transfer_method: fileItem.type,
        url: fileItem.url || '',
        upload_file_id: fileItem.fileId || '',
      }));

      // Gọi API aht-miagent (sử dụng InstalledApp)
      const response = await sendChatMessage(installedAppId, currentInput, conversationId, visionFiles.length > 0 ? visionFiles : undefined);
      
      
      
      // Lưu conversation_id để tiếp tục cuộc hội thoại
      if (response.conversation_id) {
        const isNewConversation = !conversationId;
        setConversationId(response.conversation_id);
        
        // Nếu là conversation mới, tự động generate tên và refresh sidebar
        if (isNewConversation) {
          
          // Tự động generate tên conversation (async, không block UI)
          generationConversationName(installedAppId, response.conversation_id)
            .then((updatedConversation) => {
              // Refresh sidebar để hiển thị tên mới
              setRefreshTrigger(prev => prev + 1);
            })
            .catch((error) => {
              console.error('Error generating conversation name:', error);
              // Vẫn refresh sidebar dù generate name fail
              setRefreshTrigger(prev => prev + 1);
            });
        }
      }
      
      const botMessage: Message = {
        id: response.message_id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        createdAt: new Date(response.created_at * 1000),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      console.error("Error details:", {
        installedAppId,
        message: error.message,
        stack: error.stack
      });
      
      // Hiển thị lỗi chi tiết hơn
      let errorMsg = error.message || "Không thể gửi tin nhắn";
      if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('không hợp lệ')) {
        errorMsg = `Installed app không hợp lệ hoặc không tồn tại. Đang tìm lại installed app...`;
        
        // Tự động tìm lại installed app
        try {
          const app = await getFirstInstalledChatApp();
          if (app) {
            setInstalledAppId(app.id);
            localStorage.setItem('current_installed_app_id', app.id);
            errorMsg = `Đã tìm thấy installed app mới: ${app.app.name}. Vui lòng thử lại.`;
          } else {
            errorMsg = `Không tìm thấy installed app nào. Vui lòng cài đặt app chat trong aht-miagent.`;
          }
        } catch (reloadError: any) {
          console.error('Error reloading installed app:', reloadError);
          errorMsg = `Không thể tìm lại installed app: ${reloadError.message}`;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Lỗi: ${errorMsg}`,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setAppError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. RENDER UI ---
  return (
    <div className="flex h-screen bg-white">
      <ChatSidebar 
        installedAppId={installedAppId}
        currentConversationId={conversationId}
        onConversationChange={handleConversationChange}
        onNewChat={handleNewChat}
        refreshTrigger={refreshTrigger}
      />

      <main className="flex-1 flex flex-col h-full relative">
        <header className="p-4 border-b md:hidden flex items-center justify-between">
          <span className="font-bold">Scots Chat</span>
        </header>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="relative h-full overflow-y-auto">
            <div className="px-4 pt-4 max-w-3xl mx-auto">
              {appError && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm mb-2">
                  ⚠️ {appError}
                </div>
              )}
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                    Xin chào, tôi có thể giúp gì?
                  </h1>
                  {!installedAppId && !appError && (
                    <p className="text-sm text-gray-500 mt-2">Đang tải app...</p>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {isLoading && (
                    <div className="flex mb-2">
                      <div className="shrink-0 relative w-10 h-10">
                        <div className="flex items-center justify-center w-full h-full rounded-full overflow-hidden bg-[#d5f5f6] border-none text-xl">
                          <img
                            src="/avatar.png"
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
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
                            <div className="flex items-center gap-2 text-gray-500">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-md">
          <div className="max-w-3xl mx-auto relative">
            <div
              className={`
                p-[5.5px] max-h-[150px] bg-white border-[1.5px] overflow-y-auto
                ${files.length !== 0 ? "rounded-xl" : input.length > 50 ? "rounded-xl" : "rounded-full"}
                ${isDragActive ? "border-blue-600" : "border-gray-300"}
              `}
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {/* Image Upload Button */}
              <div className="absolute bottom-2 left-2 flex items-center bg-transparent z-10">
                <ChatImageUploader
                  settings={{
                    enabled: true,
                    number_limits: 3,
                    transfer_methods: [TransferMethod.local_file, TransferMethod.remote_url],
                    image_file_size_limit: 5,
                  }}
                  onUpload={onUpload}
                  disabled={files.length >= 3}
                />
                {files.length > 0 && <div className="mx-1 w-[1px] h-4 bg-black/5" />}
              </div>

              {/* Image List */}
              {files.length > 0 && (
                <div className="pl-[52px] mb-2">
                  <ImageList
                    list={files}
                    onRemove={onRemove}
                    onReUpload={onReUpload}
                    onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                    onImageLinkLoadError={onImageLinkLoadError}
                  />
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={onPaste}
                  placeholder="Nhập câu hỏi của bạn..."
                  className={`
                    block w-full px-2 pr-[118px] py-[8px] leading-5 text-base text-gray-700 outline-none appearance-none resize-none bg-transparent
                    ${files.length > 0 ? "pl-12" : "pl-12"}
                  `}
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute bottom-1 right-2 flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <SendHorizontal size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}