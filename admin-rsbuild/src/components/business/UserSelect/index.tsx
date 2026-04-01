import React, { useMemo, useState } from 'react';
import { Select } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { ApiUser } from '@/api';
import type { User } from '@/api/modules/user';
import useDebounce from '@/hooks/useDebounce';

const RECENT_USERS_KEY = 'userSelect:recentUsers';
const RECENT_USERS_MAX = 10;

/**
 * 从 localStorage 读取最近选择的用户列表。
 */
function getRecentUsers(): User[] {
  try {
    const raw = localStorage.getItem(RECENT_USERS_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

/**
 * 将选中的用户写入最近选择列表（去重 + 最多保留 RECENT_USERS_MAX 条）。
 */
function saveRecentUser(user: User) {
  const prev = getRecentUsers().filter((u) => u.id !== user.id);
  const next = [user, ...prev].slice(0, RECENT_USERS_MAX);
  localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(next));
}

export interface UserSelectProps {
  /** 当前选中的用户 ID。 */
  value?: number;
  /** 选中变化回调。 */
  onChange?: (userId: number | undefined) => void;
  /** 占位文本。 */
  placeholder?: string;
  /** 是否允许清空。 */
  allowClear?: boolean;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 组件尺寸。 */
  size?: 'large' | 'middle' | 'small';
}

/**
 * 用户搜索下拉选择框。
 *
 * - 无关键字时默认展示最近选择的 10 个用户（来自 localStorage）。
 * - 输入关键字时远程搜索用户昵称。
 * - 选中后将用户信息写入最近选择列表，并回传用户 ID。
 */
const UserSelect = (props: UserSelectProps) => {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 400);

  /** 是否处于搜索状态（有输入关键字）。 */
  const isSearching = debouncedKeyword.trim().length > 0;

  const { data, isFetching } = useQuery({
    queryKey: ['userSelectSearch', debouncedKeyword],
    queryFn: () =>
      ApiUser.getPageList({
        nickname: debouncedKeyword || undefined,
        current: 1,
        pageSize: 20,
      }),
    // 无关键字时不发起请求，由最近选择列表兜底
    enabled: isSearching,
    placeholderData: (prev) => prev,
  });

  const options = useMemo(() => {
    if (isSearching) {
      // 搜索模式：展示接口返回结果
      return (data?.items ?? []).map((user) => ({
        value: user.id,
        label: user.nickname || user.username,
      }));
    }
    // 默认模式：展示最近选择的用户
    return getRecentUsers().map((user) => ({
      value: user.id,
      label: user.nickname || user.username,
    }));
  }, [isSearching, data]);

  const handleChange = (userId: number | undefined) => {
    if (userId !== undefined) {
      // 在当前候选列表中找到完整用户信息并保存
      const allUsers = isSearching ? (data?.items ?? []) : getRecentUsers();
      const user = allUsers.find((u) => u.id === userId);
      if (user) saveRecentUser(user);
    }
    props.onChange?.(userId);
  };

  return (
    <Select
      showSearch={{
        onSearch: setKeyword,
        filterOption: false,
      }}
      loading={isFetching}
      options={options}
      value={props.value}
      onChange={handleChange}
      placeholder={props.placeholder ?? '请输入昵称搜索用户'}
      allowClear={props.allowClear ?? true}
      disabled={props.disabled}
      size={props.size}
      notFoundContent={
        isFetching ? '搜索中...' : isSearching ? '未找到用户' : '暂无最近选择'
      }
    />
  );
};

export default UserSelect;
