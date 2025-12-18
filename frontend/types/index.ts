// src/types/index.ts
export type Role = 'user' | 'assistant';

export interface MessageFile {
  id?: string;
  type: 'image';
  url: string;
  belongs_to?: 'user' | 'assistant';
  transfer_method?: 'local_file' | 'remote_url';
  upload_file_id?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: Date;
  message_files?: MessageFile[];
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
}