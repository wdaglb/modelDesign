import React, { useEffect, useRef, useState } from 'react';

import { Avatar, Button, Card, Flex, Input, List, Space, Tag, Typography } from 'antd';

import type { AiChatMessage } from '@/api/modules/ai';

const { Text } = Typography;

export interface ChatPanelProps {
  messages: AiChatMessage[];
  loading: boolean;
  onSend: (content: string) => Promise<void>;
  onClear?: () => void;
}

const roleLabelMap: Record<AiChatMessage['role'], string> = {
  user: '我',
  assistant: 'AI',
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, loading, onSend, onClear }) => {
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const value = input.trim();
    if (!value || loading) return;
    setInput('');
    await onSend(value);
  };

  const handlePressEnter: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.shiftKey) return;
    e.preventDefault();
    handleSend();
  };

  return (
    <Card
      title="AI 聊天"
      styles={{
        body: {
          padding: 0,
          height: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <div
        ref={listRef}
        style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
        }}
      >
        <List
          dataSource={messages}
          split={false}
          renderItem={(item) => {
            const isUser = item.role === 'user';
            return (
              <List.Item style={{ borderBlockEnd: 'none', padding: '8px 0' }}>
                <Flex justify={isUser ? 'flex-end' : 'flex-start'} gap={8} align="flex-start">
                  {!isUser && <Avatar size={32}>AI</Avatar>}
                  <div
                    style={{
                      maxWidth: '70%',
                      textAlign: 'left',
                    }}
                  >
                    <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                      <Space>
                        <Tag color={isUser ? 'blue' : 'green'}>{roleLabelMap[item.role]}</Tag>
                        {item.created_at && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(item.created_at).toLocaleTimeString()}
                          </Text>
                        )}
                      </Space>
                      <div
                        style={{
                          backgroundColor: isUser ? '#1677ff' : '#f5f5f5',
                          color: isUser ? '#fff' : 'inherit',
                          borderRadius: 8,
                          padding: '8px 12px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.content}
                      </div>
                    </Space>
                  </div>
                  {isUser && <Avatar size={32}>我</Avatar>}
                </Flex>
              </List.Item>
            );
          }}
        />
      </div>
      <div
        style={{
          borderTop: '1px solid #f0f0f0',
          padding: 16,
        }}
      >
        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的问题，Enter 发送，Shift+Enter 换行"
            autoSize={{ minRows: 2, maxRows: 4 }}
            onPressEnter={handlePressEnter}
          />
          <Flex justify="space-between" align="center">
            <Space>
              {onClear && (
                <Button onClick={onClear} disabled={loading}>
                  清空会话
                </Button>
              )}
            </Space>
            <Button type="primary" onClick={handleSend} loading={loading}>
              发送
            </Button>
          </Flex>
        </Space>
      </div>
    </Card>
  );
};

export default ChatPanel;
export type { ChatPanelProps };
