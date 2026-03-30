import React from 'react';

import { createFileRoute } from '@tanstack/react-router';
import { Flex } from 'antd';

import ChatPanel from '@/components/business/AiChat/ChatPanel';
import { useAiChat } from '@/hooks/useAiChat';

export const Route = createFileRoute('/ai/chat')({
  component: RouteComponent,
});

function RouteComponent() {
  const { messages, loading, sendMessage, clearMessages } = useAiChat();

  return (
    <Flex style={{ padding: 16 }}>
      <ChatPanel
        messages={messages}
        loading={loading}
        onSend={sendMessage}
        onClear={clearMessages}
      />
    </Flex>
  );
}
