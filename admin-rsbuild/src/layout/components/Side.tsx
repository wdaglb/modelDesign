import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Dropdown, Layout, Menu, Modal } from 'antd';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';

import { ApiSystemMessage } from '@/api';
import { useKDrawer } from '@/components/KDrawer';
import { useKModal } from '@/components/KModal';
import {
  MessageCenterDrawer,
  MessageNotificationButton,
} from '@/components';
import queryKey from '@/constants/queryKey';
import useSystemMessageBrowserNotification from '@/hooks/useSystemMessageBrowserNotification.ts';
import useFileUrl from '@/hooks/useFileUrl.ts';
import {
  requestBrowserNotificationPermissionIfSupported,
  SYSTEM_MESSAGE_POLL_INTERVAL,
} from '@/service/browserNotificationService.ts';
import {
  markBrowserNotificationPermissionPrompted,
  shouldPromptBrowserNotificationPermission,
} from '@/service/browserNotificationPermissionPrompt.ts';
import { logout } from '@/service/loginService.ts';
import useAuthStore from '@/store/auth.ts';

import ChangePasswordForm from './ChangePasswordForm.tsx';
import {
  buildSideMenuData,
  resolveSideSelectedKey,
} from './#sideMenuHelper.tsx';

const Side = () => {
  const { currentInfo, menus } = useAuthStore(
    useShallow((state) => ({
      currentInfo: state.currentInfo,
      menus: state.menus,
    })),
  );

  const location = useLocation();
  const navigate = useNavigate();
  const drawer = useKDrawer();
  const modal = useKModal();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const { data: unreadCountData } = useQuery({
    queryKey: queryKey.systemMessage.unreadCount(),
    queryFn: () => ApiSystemMessage.getUnreadCount(),
    enabled: Boolean(currentInfo?.userId),
    staleTime: 0,
    refetchInterval: SYSTEM_MESSAGE_POLL_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  useSystemMessageBrowserNotification({
    userId: currentInfo?.userId,
  });

  useEffect(() => {
    const userId = currentInfo?.userId;
    if (!shouldPromptBrowserNotificationPermission(userId)) {
      return;
    }

    /**
     * 进入系统后的首次提示只负责征求用户同意，
     * 真正的浏览器授权请求放到确认按钮点击链路里，兼容浏览器的手势限制。
     */
    markBrowserNotificationPermissionPrompted(userId);
    Modal.confirm({
      title: '开启消息通知',
      content:
        '开启后可在系统消息到达时接收浏览器提醒，避免错过任务分配和状态变更。',
      okText: '去授权',
      cancelText: '暂不需要',
      centered: true,
      onOk: async () => {
        await requestBrowserNotificationPermissionIfSupported();
      },
    });
  }, [currentInfo?.userId]);

  const navigateMenu = useCallback(
    (key: string) => {
      navigate({ to: key });
    },
    [navigate],
  );
  const { menuData, parentKeys } = useMemo(
    () => buildSideMenuData(menus, navigateMenu),
    [menus, navigateMenu],
  );

  const displayName = currentInfo?.nickname || currentInfo?.username || '未登录用户';
  const avatarText = (displayName[0] || 'U').toUpperCase();
  const avatarUrl = useFileUrl(currentInfo?.avatarId);
  const unreadCount = unreadCountData?.unreadCount || 0;

  useEffect(() => {
    const currentSelectedKey = resolveSideSelectedKey(
      location.pathname,
      parentKeys,
    );
    const currentParentKeys = parentKeys[currentSelectedKey] || [];

    /**
     * 路由切换时合并当前菜单所属的父级展开项，保留用户手动展开的其它菜单，
     * 避免点击其它子菜单后把已展开分组自动收起。
     */
    setOpenKeys((previousOpenKeys) =>
      Array.from(new Set([...previousOpenKeys, ...currentParentKeys])),
    );
    setSelectedKeys([currentSelectedKey]);
  }, [location.pathname, parentKeys]);

  const handleUserAction = async (key: string) => {
    if (key === 'personalCenter') {
      navigate({ to: '/personal-center' });
      return;
    }

    if (key === 'changePassword') {
      await modal.open({
        title: '修改密码',
        width: 480,
        children: <ChangePasswordForm />,
      });
      return;
    }

    if (key === 'logout') {
      await logout(true);
    }
  };

  const openMessageDrawer = () => {
    drawer.open({
      placement: 'left',
      size: 408,
      title: null,
      closable: false,
      styles: {
        body: {
          padding: 0,
        },
      },
      children: <MessageCenterDrawer />,
    });
  };

  return (
    <Layout.Sider
      width={240}
      style={{
        height: '100vh',
        position: 'sticky',
        insetInlineStart: 0,
        top: 0,
        background: 'linear-gradient(180deg, #001529 0%, #00111f 100%)',
        boxShadow: '2px 0 12px rgba(0, 0, 0, 0.18)',
      }}
    >
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 12px 12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
              minHeight: 58,
              padding: '10px 12px',
              borderRadius: 18,
              background:
                'linear-gradient(135deg, rgba(59, 130, 246, 0.44) 0%, rgba(37, 99, 235, 0.26) 48%, rgba(15, 23, 42, 0.16) 100%)',
              border: '1px solid rgba(96, 165, 250, 0.36)',
              boxShadow:
                'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 12px 28px rgba(37, 99, 235, 0.18)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 40,
                height: 40,
                flexShrink: 0,
              }}
            >
              <Avatar
                size={40}
                src={avatarUrl}
                style={{
                  background:
                    'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.34)',
                }}
              >
                {avatarText}
              </Avatar>

              <MessageNotificationButton
                unreadCount={unreadCount}
                onClick={openMessageDrawer}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                }}
              />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: '20px',
                  textShadow: '0 1px 10px rgba(37, 99, 235, 0.22)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </div>
            </div>

            <Dropdown
              trigger={['click']}
              placement={'bottomRight'}
              menu={{
                items: [
                  { key: 'personalCenter', label: '个人中心' },
                  { key: 'changePassword', label: '修改密码' },
                  { key: 'logout', label: '注销登录' },
                ],
                onClick: async ({ key }) => {
                  await handleUserAction(key);
                },
              }}
            >
              <button
                type={'button'}
                style={{
                  width: 24,
                  height: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.72)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Icon
                  icon={'mdi:chevron-down'}
                  style={{
                    fontSize: 15,
                  }}
                />
              </button>
            </Dropdown>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '0 8px 12px',
            scrollbarWidth: 'thin',
            scrollbarGutter: 'stable',
          }}
        >
          <Menu
            theme={'dark'}
            mode={'inline'}
            items={menuData as any}
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            style={{
              background: 'transparent',
              borderInlineEnd: 'none',
            }}
            onClick={(menu) => {
              navigateMenu(menu.key);
            }}
            onOpenChange={(keys) => {
              setOpenKeys(keys);
            }}
          />
        </div>
      </div>
    </Layout.Sider>
  );

};

export default memo(Side);
