/**
 * Service để gọi API aht-miagent
 */

const MIAGENT_API_URL = process.env.NEXT_PUBLIC_MIAGENT_API_URL || "http://localhost:5001";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  interface_language?: string;
}

export interface ChatResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
  created_at: number;
}

export interface InstalledApp {
  id: string;
  app: {
    id: string;
    name: string;
    mode: string;
  };
  is_pinned: boolean;
  last_used_at?: string;
}

export interface InstalledAppListResponse {
  installed_apps: InstalledApp[];
  workspace_role: string;
}

export interface ConversationItem {
  id: string;
  name: string;
  inputs: Record<string, any>;
  introduction: string;
  system_parameters: Record<string, any>;
  created_at: number;
  updated_at: number;
}

export interface ConversationListResponse {
  data: ConversationItem[];
  has_more: boolean;
  limit: number;
}

/**
 * Lấy token từ localStorage
 */
import { getToken, clearAuth } from './auth';

/**
 * Gọi API với authentication
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const url = `${MIAGENT_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      window.location.href = '/login';
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
    const error = await response.json().catch(() => ({ error: 'Unknown error', message: 'Unknown error' }));
    const errorMessage = error.message || error.error || `API error: ${response.status}`;
    console.error(`API Error [${response.status}]: ${url}`, error);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Lấy thông tin user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  return apiCall<UserProfile>('/console/api/account/profile');
}

/**
 * Lấy danh sách installed apps
 */
export async function getInstalledApps(): Promise<InstalledAppListResponse> {
  return apiCall<InstalledAppListResponse>('/console/api/installed-apps');
}

/**
 * Kiểm tra installed app ID có hợp lệ không
 */
export async function verifyInstalledAppId(installedAppId: string): Promise<boolean> {
  try {
    const apps = await getInstalledApps();
    return apps.installed_apps.some(app => app.id === installedAppId);
  } catch (error) {
    console.error('Error verifying installed app ID:', error);
    return false;
  }
}

export interface DomainLookupResponse {
  installedAppsId: string;
  app_id: string;
  domain: string;
}

/**
 * Lấy installed app ID từ domain (sử dụng domain/lookup API)
 * @param domain - Domain để lookup (ví dụ: example.com)
 */
export async function getInstalledAppIdByDomain(domain: string): Promise<string | null> {
  try {
    // API domain/lookup là public API (service_api), không cần authentication
    // Endpoint: /v1/domain/lookup (service_api có prefix /v1)
    const url = `${MIAGENT_API_URL}/v1/domain/lookup?domain=${encodeURIComponent(domain)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Domain not found:', domain);
        return null;
      }
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || error.error || `Domain lookup failed: ${response.status}`);
    }

    const data: DomainLookupResponse = await response.json();
    return data.installedAppsId;
  } catch (error: any) {
    console.error('Error looking up domain:', error);
    throw error;
  }
}

/**
 * Lấy installed app chat đầu tiên (chat hoặc agent-chat)
 * Fallback nếu domain lookup không thành công
 */
export async function getFirstInstalledChatApp(): Promise<InstalledApp | null> {
  try {
    const response = await getInstalledApps();
    
    if (!response.installed_apps || response.installed_apps.length === 0) {
      console.warn('No installed apps found');
      return null;
    }
    
    const chatApps = response.installed_apps.filter(
      (app) => app.app.mode === 'chat' || app.app.mode === 'agent-chat' || app.app.mode === 'advanced-chat'
    );
    
    
    
    if (chatApps.length > 0) {
      // Ưu tiên app được pin hoặc dùng gần đây nhất
      return chatApps[0];
    }
    
    return null;
  } catch (error: any) {
    console.error('Error getting installed apps:', error);
    throw error; // Re-throw để page.tsx có thể xử lý
  }
}

/**
 * Gửi tin nhắn chat (sử dụng InstalledApp - giống explore/home)
 * @param installedAppId - ID của installed app trong aht-miagent
 * @param message - Nội dung tin nhắn
 * @param conversationId - ID cuộc hội thoại (optional)
 */
// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface VisionFile {
  type: 'image';
  transfer_method: 'local_file' | 'remote_url';
  url: string;
  upload_file_id?: string;
}

export async function sendChatMessage(
  installedAppId: string,
  message: string,
  conversationId?: string,
  files?: VisionFile[]
): Promise<ChatResponse> {
  if (!installedAppId || installedAppId.trim() === '') {
    throw new Error('InstalledApp ID không hợp lệ. Vui lòng kiểm tra lại cấu hình.');
  }

  // Validate UUID format
  if (!UUID_REGEX.test(installedAppId)) {
    throw new Error(`InstalledApp ID không đúng format UUID: ${installedAppId}. Vui lòng kiểm tra lại.`);
  }

  

  const token = getToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  // API của InstalledApp luôn trả về streaming (SSE), cần xử lý SSE response
  const url = `${MIAGENT_API_URL}/console/api/installed-apps/${installedAppId}/chat-messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      inputs: {},
      query: message,
      conversation_id: conversationId,
      auto_generate_name: true,
      ...(files && files.length > 0 ? {
        files: files.map((item) => {
          if (item.transfer_method === 'local_file') {
            return {
              ...item,
              url: '', // Local files should have empty url
            };
          }
          return item;
        }),
      } : {}),
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Phiên đăng nhập đã hết hạn');
    }
    const error = await response.json().catch(() => ({ error: 'Unknown error', message: 'Unknown error' }));
    const errorMessage = error.message || error.error || `API error: ${response.status}`;
    console.error(`API Error [${response.status}]: ${url}`, error);
    throw new Error(errorMessage);
  }

  // Xử lý SSE response - tham khảo cách xử lý của explore/home
  const reader = response.body?.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let answer = '';
  let receivedConversationId = '';
  let receivedMessageId = '';
  let receivedCreatedAt = 0;
  let isFirstMessage = true;
  let messageEndReceived = false;

  if (!reader) {
    throw new Error('Response body không có reader');
  }

  // Helper function để decode unicode (giống aht-miagent)
  const unicodeToChar = (text: string) => {
    return text.replace(/\\u[\dA-F]{4}/gi, (match) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
  };

  function read(): Promise<void> {
    return reader!.read().then((result: any) => {
      if (result.done) {
        return;
      }

      buffer += decoder.decode(result.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Giữ lại phần chưa hoàn chỉnh

      try {
        lines.forEach((line: string) => {
          if (line.trim() === '' || line.startsWith(':')) {
            return; // Bỏ qua dòng trống hoặc comment
          }

          if (line.startsWith('data: ')) {
            let bufferObj: Record<string, any>;
            try {
              bufferObj = JSON.parse(line.substring(6)) as Record<string, any>; // Bỏ "data: "
            } catch (e) {
              // Bỏ qua dòng không parse được (có thể là message bị cắt)
              return;
            }

            if (bufferObj.status === 400 || !bufferObj.event) {
              throw new Error(bufferObj.message || bufferObj.error || 'API error');
            }

            // Xử lý event message hoặc agent_message - tích lũy answer từ chunks
            if (bufferObj.event === 'message' || bufferObj.event === 'agent_message') {
              // Answer được gửi theo chunks, cần tích lũy
              if (bufferObj.answer !== undefined && bufferObj.answer !== null) {
                const chunk = unicodeToChar(bufferObj.answer);
                answer += chunk;
              }

              // Lưu conversation_id và message_id từ message đầu tiên
              if (isFirstMessage && bufferObj.conversation_id) {
                receivedConversationId = bufferObj.conversation_id;
              }
              if (isFirstMessage && bufferObj.id) {
                receivedMessageId = bufferObj.id;
              }
              if (bufferObj.created_at) {
                receivedCreatedAt = bufferObj.created_at;
              }
              isFirstMessage = false;
            } else if (bufferObj.event === 'message_end') {
              // Message kết thúc
              if (bufferObj.conversation_id && !receivedConversationId) {
                receivedConversationId = bufferObj.conversation_id;
              }
              if (bufferObj.message_id && !receivedMessageId) {
                receivedMessageId = bufferObj.message_id;
              } else if (bufferObj.id && !receivedMessageId) {
                receivedMessageId = bufferObj.id;
              }
              if (bufferObj.created_at && !receivedCreatedAt) {
                receivedCreatedAt = bufferObj.created_at;
              }
              messageEndReceived = true;
            } else if (bufferObj.event === 'ping') {
              // Bỏ qua ping events
              return;
            }
          }
        });
      } catch (e: any) {
        throw new Error(e.message || 'Error parsing SSE stream');
      }

      // Tiếp tục đọc nếu chưa có message_end
      if (!messageEndReceived) {
        return read();
      }
    });
  }

  // Bắt đầu đọc stream
  await read();

  if (!receivedConversationId && !receivedMessageId) {
    throw new Error('Không nhận được response từ server');
  }

  // Parse response từ SSE
  return {
    answer: answer || '',
    conversation_id: receivedConversationId || '',
    message_id: receivedMessageId || '',
    created_at: receivedCreatedAt || Math.floor(Date.now() / 1000),
  };
}

/**
 * Lấy danh sách conversations của installed app
 */
export async function getConversations(
  installedAppId: string,
  lastId?: string,
  pinned?: boolean,
  limit: number = 20
): Promise<ConversationListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });
  
  if (lastId) {
    params.append('last_id', lastId);
  }
  
  if (pinned !== undefined) {
    params.append('pinned', pinned.toString());
  }
  
  return apiCall<ConversationListResponse>(
    `/console/api/installed-apps/${installedAppId}/conversations?${params.toString()}`
  );
}

/**
 * Pin conversation
 */
export async function pinConversation(installedAppId: string, conversationId: string): Promise<void> {
  await apiCall(`/console/api/installed-apps/${installedAppId}/conversations/${conversationId}/pin`, {
    method: 'PATCH',
  });
}

/**
 * Unpin conversation
 */
export async function unpinConversation(installedAppId: string, conversationId: string): Promise<void> {
  await apiCall(`/console/api/installed-apps/${installedAppId}/conversations/${conversationId}/unpin`, {
    method: 'PATCH',
  });
}

/**
 * Xóa conversation
 */
export async function deleteConversation(installedAppId: string, conversationId: string): Promise<void> {
  await apiCall(`/console/api/installed-apps/${installedAppId}/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}

/**
 * Đổi tên conversation
 */
export async function renameConversation(
  installedAppId: string,
  conversationId: string,
  name: string
): Promise<ConversationItem> {
  return apiCall<ConversationItem>(
    `/console/api/installed-apps/${installedAppId}/conversations/${conversationId}/name`,
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    }
  );
}

/**
 * Tự động generate tên conversation (sử dụng AI)
 */
export async function generationConversationName(
  installedAppId: string,
  conversationId: string
): Promise<ConversationItem> {
  return apiCall<ConversationItem>(
    `/console/api/installed-apps/${installedAppId}/conversations/${conversationId}/name`,
    {
      method: 'POST',
      body: JSON.stringify({ auto_generate: true }),
    }
  );
}

/**
 * Lấy danh sách messages của conversation
 */
export interface ChatMessage {
  id: string;
  query: string;
  answer: string;
  created_at: number;
  message_files?: any[];
  retriever_resources?: any[];
}

export interface ChatListResponse {
  data: ChatMessage[];
  has_more: boolean;
  limit: number;
}

export async function getChatList(
  installedAppId: string,
  conversationId: string,
  lastId?: string,
  limit: number = 20
): Promise<ChatListResponse> {
  const params = new URLSearchParams({
    conversation_id: conversationId,
    limit: limit.toString(),
  });
  
  if (lastId) {
    params.append('last_id', lastId);
  }
  
  return apiCall<ChatListResponse>(
    `/console/api/installed-apps/${installedAppId}/messages?${params.toString()}`
  );
}
