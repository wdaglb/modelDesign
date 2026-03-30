import { useState } from 'react';

import { message as antdMessage } from 'antd';

import type { AiChatMessage, AiChatResponse } from '@/api/modules/ai';
import { aiChat } from '@/api/modules/ai';

export interface UseAiChatOptions {
  initial_messages?: AiChatMessage[];
}

export interface UseAiChatResult {
  messages: AiChatMessage[];
  loading: boolean;
  sessionId?: string;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatResult {
  const [messages, setMessages] = useState<AiChatMessage[]>(options.initial_messages || []);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  const sendMessage = async (content: string) => {
    const value = content.trim();
    if (!value) return;

    const userMessage: AiChatMessage = {
      role: 'user',
      content: value,
      created_at: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res: AiChatResponse = await aiChat({
        session_id: sessionId,
        messages: nextMessages,
      });
      setSessionId(res.session_id);
      setMessages(res.messages);
    } catch (err) {
      antdMessage.error('发送消息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    sessionId,
    sendMessage,
    clearMessages,
  };
}
