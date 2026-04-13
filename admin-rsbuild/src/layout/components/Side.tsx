import { memo, ReactNode, useEffect, useMemo, useState } from 'react';
import { Avatar, Dropdown, Layout, Menu } from 'antd';
import { ItemType } from 'antd/es/menu/interface';
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
import { SYSTEM_MESSAGE_POLL_INTERVAL } from '@/service/browserNotificationService.ts';
import { logout } from '@/service/loginService.ts';
import useAuthStore from '@/store/auth.ts';

import ChangePasswordForm from './ChangePasswordForm.tsx';

type MenuItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  children?: MenuItem[];
};

type ParentKeys = Record<string, string[]>;

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

  const { menuData, parentKeys } = useMemo(() => {
    const result: MenuItem[] = [];
    const keyData: Record<number, MenuItem> = {};
    const menuParentIds: Record<number, number | undefined> = {};
    const keys: ParentKeys = {};

    menus.forEach((item) => {
      keyData[item.id] = {
        key: item.name.startsWith('/') ? item.name : `/${item.name}`,
        label: item.title,
        icon: item.iconValue ? <Icon icon={item.iconValue} /> : null,
        children: [],
      };
      menuParentIds[item.id] = item.parentId || undefined;
    });

    const getParentKeys = (id: number) => {
      const parentPath: string[] = [];
      let currentParentId = menuParentIds[id];

      while (currentParentId) {
        const parent = keyData[currentParentId];
        if (!parent) {
          break;
        }
        parentPath.unshift(parent.key);
        currentParentId = menuParentIds[currentParentId];
      }

      return parentPath;
    };

    const pruneEmptyChildren = (items: MenuItem[]) => {
      items.forEach((item) => {
        if (item.children?.length) {
          pruneEmptyChildren(item.children);
        }

        if (!item.children?.length) {
          delete item.children;
        }
      });
    };

    menus.forEach((item) => {
      const current = keyData[item.id];
      keys[current.key] = getParentKeys(item.id);

      if (!item.parentId) {
        result.push(current);
        return;
      }

      const parent = keyData[item.parentId];
      if (!parent) {
        return;
      }

      parent.children ??= [];
      parent.children.push(current);
    });

    pruneEmptyChildren(result);

    return {
      menuData: result as ItemType[],
      parentKeys: keys,
    };
  }, [menus]);

  const displayName = currentInfo?.nickname || currentInfo?.username || '未登录用户';
  const avatarText = (displayName[0] || 'U').toUpperCase();
  const avatarUrl = useFileUrl(currentInfo?.avatarId);
  const unreadCount = unreadCountData?.unreadCount || 0;

  useEffect(() => {
    /**
     * 优先匹配路径最长的菜单 key，避免 `/system/user` 被父级 `/system`
     * 提前命中，导致子菜单高亮与父级展开状态异常。
     */
    const matchedSelectedKey = Object.keys(parentKeys)
      .filter((key) => location.pathname === key || location.pathname.startsWith(`${key}/`))
      .sort((leftKey, rightKey) => rightKey.length - leftKey.length)[0];
    const currentSelectedKey = matchedSelectedKey || location.pathname;
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
              navigate({ to: menu.key });
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
