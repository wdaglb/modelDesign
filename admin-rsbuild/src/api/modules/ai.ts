import type { AxiosResponse } from 'axios';

import request from '@/utils/request';

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AiChatRequest {
  session_id?: string;
  messages: AiChatMessage[];
  model?: string;
  stream?: boolean;
}

export interface AiChatResponse {
  session_id: string;
  reply: AiChatMessage;
  messages: AiChatMessage[];
  finish_reason?: string;
}

// 临时 mock：本地生成简单回复，后续可切换为真实后端接口
export async function aiChat(params: AiChatRequest): Promise<AiChatResponse> {
  const { messages, session_id } = params;
  const last = messages[messages.length - 1];

  const now = new Date().toISOString();
  const reply: AiChatMessage = {
    role: 'assistant',
    content: `已收到：${last?.content || ''}`,
    created_at: now,
  };

  const nextSessionId = session_id || `local_${Date.now()}`;

  // 模拟异步请求
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    session_id: nextSessionId,
    reply,
    messages: [...messages, reply],
    finish_reason: 'mock',
  };
}
