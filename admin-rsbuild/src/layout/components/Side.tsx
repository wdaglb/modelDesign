import React, { memo, ReactNode, useEffect, useMemo, useState } from 'react';
import { Avatar, Dropdown, Layout, Menu } from 'antd';
import { ItemType } from 'antd/es/menu/interface';
import { Icon } from '@iconify/react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';

import { useKModal } from '@/components/KModal';
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
  const modal = useKModal();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

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
  const subTitle = currentInfo?.username || '点击查看操作';
  const avatarText = (displayName[0] || 'U').toUpperCase();

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
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'changePassword', label: '修改密码' },
                { key: 'logout', label: '注销登录' },
              ],
              onClick: async ({ key }) => {
                await handleUserAction(key);
              },
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 12px',
                cursor: 'pointer',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(22, 119, 255, 0.2) 0%, rgba(22, 119, 255, 0.08) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                transition: 'all 0.2s ease',
              }}
            >
              <Avatar
                size={40}
                style={{
                  background: 'linear-gradient(135deg, #4096ff 0%, #1677ff 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  flexShrink: 0,
                  boxShadow: '0 6px 16px rgba(22, 119, 255, 0.28)',
                }}
              >
                {avatarText}
              </Avatar>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: '22px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontSize: 12,
                    lineHeight: '20px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {subTitle}
                </div>
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.08)',
                  flexShrink: 0,
                }}
              >
                <Icon
                  icon={'mdi:chevron-down'}
                  style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 18 }}
                />
              </div>
            </div>
          </Dropdown>
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
