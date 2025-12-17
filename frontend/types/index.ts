// src/types/index.ts
export type Role = 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
}