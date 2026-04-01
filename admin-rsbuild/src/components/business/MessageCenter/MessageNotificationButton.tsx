import { Icon } from '@iconify/react';
import { Tooltip } from 'antd';
import type { CSSProperties, MouseEvent } from 'react';

import { formatUnreadCount } from './helpers';

interface MessageNotificationButtonProps {
  /**
   * 未读数量。
   */
  unreadCount?: number;

  /**
   * 点击回调。
   */
  onClick: () => void;

  /**
   * 自定义样式。
   */
  style?: CSSProperties;
}

/**
 * 消息通知入口按钮。
 */
const MessageNotificationButton = (props: MessageNotificationButtonProps) => {
  const badgeText = formatUnreadCount(props.unreadCount);
  let showBadge = false;

  if (badgeText) {
    showBadge = true;
  }

  return (
    <Tooltip title={'消息通知'} placement={'right'}>
      <button
        type={'button'}
        style={{
          position: 'relative',
          width: 22,
          height: 22,
          borderRadius: 999,
          border: '1px solid rgba(147, 197, 253, 0.72)',
          background:
            'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow:
            '0 8px 22px rgba(37, 99, 235, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.28)',
          transition:
            'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
          zIndex: 2,
          ...props.style,
        }}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation();
          props.onClick();
        }}
      >
        <Icon icon={'mdi:bell-outline'} style={{ fontSize: 12 }} />

        {showBadge && (
          <span
            style={{
              position: 'absolute',
              top: -5,
              right: -7,
              minWidth: 16,
              height: 16,
              paddingInline: 4,
              borderRadius: 999,
              background: '#f97316',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
              boxShadow: '0 6px 16px rgba(249, 115, 22, 0.42)',
            }}
          >
            {badgeText}
          </span>
        )}
      </button>
    </Tooltip>
  );
};

export default MessageNotificationButton;
