import { Space, Typography } from 'antd';

import type { SystemMessageListItem } from '@/api/modules/system-message';

interface MessageListItemProps {
  /**
   * 是否处于读取中。
   */
  loading: boolean;

  /**
   * 消息项。
   */
  messageItem: SystemMessageListItem;

  /**
   * 点击回调。
   */
  onClick: (messageItem: SystemMessageListItem) => Promise<void>;
}

/**
 * 消息列表项。
 */
const MessageListItem = (props: MessageListItemProps) => {
  let backgroundColor = '#ffffff';
  let borderColor = 'rgba(15, 23, 42, 0.08)';

  if (!props.messageItem.isRead) {
    backgroundColor = 'rgba(22, 119, 255, 0.04)';
    borderColor = 'rgba(22, 119, 255, 0.16)';
  }

  return (
    <button
      type={'button'}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 14,
        borderRadius: 16,
        border: `1px solid ${borderColor}`,
        background: backgroundColor,
        cursor: 'pointer',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
      onClick={() => {
        void props.onClick(props.messageItem);
      }}
    >
      <Space
        orientation={'vertical'}
        size={8}
        style={{ width: '100%' }}
        styles={{ item: { width: '100%' } }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Space size={8}>
            {!props.messageItem.isRead && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#1677ff',
                  flexShrink: 0,
                }}
              />
            )}

            <Typography.Text strong>{props.messageItem.title}</Typography.Text>
          </Space>

          <Typography.Text
            type={'secondary'}
            style={{ fontSize: 12, flexShrink: 0 }}
          >
            {props.messageItem.createdAt}
          </Typography.Text>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 22,
              paddingInline: 8,
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.05)',
              color: '#475569',
              fontSize: 12,
              lineHeight: '22px',
            }}
          >
            {props.messageItem.category}
          </span>

          {props.loading && (
            <Typography.Text type={'secondary'} style={{ fontSize: 12 }}>
              处理中...
            </Typography.Text>
          )}
        </div>

        <Typography.Paragraph
          style={{
            margin: 0,
            color: '#475569',
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {props.messageItem.content}
        </Typography.Paragraph>
      </Space>
    </button>
  );
};

export default MessageListItem;
