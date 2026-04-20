import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';

import { ApiUser } from '@/api';
import type { User } from '@/api/modules/user';
import useDebounce from '@/hooks/useDebounce';

const RECENT_USERS_KEY = 'userSelect:recentUsers';
const RECENT_USERS_MAX = 10;

/**
 * 从 localStorage 读取最近选择的用户列表。
 *
 * 这里允许静默兜底为空数组，避免本地缓存异常影响选择器正常使用。
 *
 * @return 最近选择的用户列表
 */
function getRecentUsers(): User[] {
  try {
    const raw = localStorage.getItem(RECENT_USERS_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

/**
 * 将选中的用户写入最近选择列表。
 *
 * 这里会先按用户 ID 去重，再限制条数上限，
 * 这样可以保证最近访问记录既稳定又不会无限增长。
 *
 * @param user 当前选中的用户
 */
function saveRecentUser(user: User) {
  const prev = getRecentUsers().filter((item) => item.id !== user.id);
  const next = [user, ...prev].slice(0, RECENT_USERS_MAX);
  localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(next));
}

export interface UserSelectProps {
  /** 当前选中的用户 ID。 */
  value?: number;

  /** 当前值对应的历史展示名称。 */
  valueLabel?: string;

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
 * 核心流程：
 * 1. 无关键字时展示最近选择的用户；
 * 2. 有关键字时走后端统一 keyword 搜索；
 * 3. 选中后把完整用户信息写回最近选择列表。
 */
const UserSelect = (props: UserSelectProps) => {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 400);
  const trimmedKeyword = debouncedKeyword.trim();
  const isSearching = trimmedKeyword.length > 0;

  const { data, isFetching } = useQuery({
    queryKey: ['userSelectSearch', trimmedKeyword],
    queryFn: () =>
      ApiUser.getPageList({
        /**
         * 统一复用后端 keyword 搜索能力，
         * 让选择器与系统用户列表保持相同的搜索语义。
         */
        keyword: trimmedKeyword,
        current: 1,
        pageSize: 20,
        isDisable: false,
      }),
    enabled: isSearching,
    placeholderData: (prev) => prev,
  });

  const options = useMemo(() => {
    let users: User[] = [];

    if (isSearching) {
      users = data?.items ?? [];
    } else {
      users = getRecentUsers().filter((item) => !item.isDisable);
    }

    const nextOptions = users.map((user) => {
      let label = user.username;
      if (user.nickname) {
        label = user.nickname;
      }

      return {
        value: user.id,
        label,
      };
    });

    /**
     * 编辑历史任务时，当前负责人可能已经被禁用，因此不会再出现在候选查询里。
     * 这里把当前值作为一个禁用选项补回选择器，保证表单仍然能稳定回显历史负责人。
     */
    if (
      props.value !== undefined &&
      !nextOptions.some((item) => item.value === props.value)
    ) {
      nextOptions.unshift({
        value: props.value,
        label: props.valueLabel ?? `用户 #${props.value}`,
        disabled: true,
      });
    }

    return nextOptions;
  }, [data, isSearching, props.value, props.valueLabel]);

  /**
   * 选中用户后把当前候选项写入最近使用记录，
   * 这样下次打开选择框时可以更快命中常用负责人。
   *
   * @param userId 当前选中的用户 ID
   */
  const handleChange = (userId: number | undefined) => {
    if (userId !== undefined) {
      let allUsers: User[] = [];

      if (isSearching) {
        allUsers = data?.items ?? [];
      } else {
        allUsers = getRecentUsers();
      }

      const user = allUsers.find((item) => item.id === userId);
      if (user) {
        saveRecentUser(user);
      }
    }

    props.onChange?.(userId);
  };

  let notFoundContent = '暂无最近选择';
  if (isFetching) {
    notFoundContent = '搜索中...';
  } else if (isSearching) {
    notFoundContent = '未找到用户';
  }

  return (
    <Select
      style={{ width: '100%' }}
      showSearch={{
        onSearch: setKeyword,
        filterOption: false,
      }}
      loading={isFetching}
      options={options}
      value={props.value}
      onChange={handleChange}
      placeholder={props.placeholder ?? '请输入用户名、昵称或用户 ID'}
      allowClear={props.allowClear ?? true}
      disabled={props.disabled}
      size={props.size}
      notFoundContent={notFoundContent}
    />
  );
};

export default UserSelect;
