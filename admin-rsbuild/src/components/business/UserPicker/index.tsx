import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar,
  Checkbox,
  Empty,
  Input,
  Pagination,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';

import { ApiUser } from '@/api';
import useDebounce from '@/hooks/useDebounce';
import useFileUrl from '@/hooks/useFileUrl';

import { UserPickerMode, UserPickerProps } from './types';

const parseIds = (value: string) => {
  return Array.from(
    new Set(
      String(value || '')
        .split(/[，,\s]+/)
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  );
};

interface UserPickerItemProps {
  item: Awaited<ReturnType<typeof ApiUser.getPageList>>['items'][number];
  checked: boolean;
  disabled: boolean;
  selectedIds: number[];
  onChange?: (userIds: number[]) => void;
}

const UserPickerItem = ({
  item,
  checked,
  disabled,
  selectedIds,
  onChange,
}: UserPickerItemProps) => {
  const avatarUrl = useFileUrl(item.avatarId);

  const toggleChecked = () => {
    if (disabled) {
      return;
    }
    const nextValue = checked
      ? selectedIds.filter((id) => id !== item.id)
      : Array.from(new Set([...selectedIds, item.id]));
    onChange?.(nextValue);
  };

  return (
    <div
      onClick={toggleChecked}
      style={{
        padding: 12,
        borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: checked ? '#e6f4ff' : 'transparent',
        transition: 'background-color 0.2s ease',
      }}
      onMouseEnter={(event) => {
        if (!checked) {
          event.currentTarget.style.backgroundColor = '#f5f8ff';
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = checked
          ? '#e6f4ff'
          : 'transparent';
      }}
      className={'user-picker-item'}
    >
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space align="center" size={12}>
          <Checkbox
            checked={checked}
            disabled={disabled}
            onChange={(event) => {
              event.stopPropagation();
              toggleChecked();
            }}
          />
          <Avatar src={avatarUrl}>{item.nickname?.slice(0, 1) || '用'}</Avatar>
          <Space orientation="vertical" size={0}>
            <Typography.Text strong>
              {item.nickname || '未命名用户'}
            </Typography.Text>
            <Typography.Text type="secondary">
              用户 ID：{item.id}
            </Typography.Text>
          </Space>
        </Space>

        <Space>
          {disabled ? <Tag color="default">已加入</Tag> : null}
          {item.isDisable ? <Tag color="red">已禁用</Tag> : null}
        </Space>
      </Space>
    </div>
  );
};

const UserPicker = (props: UserPickerProps) => {
  const [mode, setMode] = useState<UserPickerMode>(
    props.defaultMode || 'search',
  );
  const [keyword, setKeyword] = useState('');
  const [idsInput, setIdsInput] = useState('');
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedKeyword = useDebounce(keyword, 400);

  const selectedIds = props.value || [];
  const excludeUserIds = props.excludeUserIds || [];
  const allDisabledIds = new Set(excludeUserIds);

  const searchParams = useMemo(() => {
    const trimmedKeyword = debouncedKeyword.trim();
    if (!trimmedKeyword) {
      return {
        current,
        pageSize,
      };
    }

    if (/^\d+(?:[，,\s]+\d+)*$/.test(trimmedKeyword)) {
      return {
        current,
        pageSize,
        ids: parseIds(trimmedKeyword),
      };
    }

    return {
      current,
      pageSize,
      nickname: trimmedKeyword,
    };
  }, [current, debouncedKeyword, pageSize]);

  const { data, isLoading } = useQuery({
    queryKey: ['userPageList', searchParams],
    queryFn: () => ApiUser.getPageList(searchParams),
    enabled: mode === 'search',
  });

  const displayValue = mode === 'ids' ? parseIds(idsInput) : selectedIds;
  const trimmedKeyword = debouncedKeyword.trim();
  const emptyDescription = trimmedKeyword
    ? `没有找到与“${trimmedKeyword}”相关的用户`
    : '暂无可选用户';

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Segmented
        block
        value={mode}
        options={[
          { label: '选择用户', value: 'search' },
          { label: '按 ID 添加', value: 'ids' },
        ]}
        onChange={(value) => {
          setMode(value as UserPickerMode);
          if (value === 'ids') {
            props.onChange?.(parseIds(idsInput));
          }
        }}
      />

      {mode === 'search' ? (
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder={'请输入昵称搜索，纯数字可按用户 ID 搜索'}
            onSearch={(value) => {
              setCurrent(1);
              setKeyword(value);
            }}
            onChange={(event) => {
              setCurrent(1);
              setKeyword(event.target.value);
            }}
          />

          <Typography.Text type="secondary">
            已选择 {selectedIds.length} 人，已加入项目的用户将不可重复选择。
          </Typography.Text>

          <Space orientation="vertical" size={12} style={{ width: '100%' }}>
            {isLoading ? (
              <Typography.Text type="secondary">加载中...</Typography.Text>
            ) : data?.items?.length ? (
              data.items.map((item) => {
                const disabled = allDisabledIds.has(item.id);
                const checked = selectedIds.includes(item.id);

                return (
                  <UserPickerItem
                    key={item.id}
                    item={item}
                    checked={checked}
                    disabled={disabled}
                    selectedIds={selectedIds}
                    onChange={props.onChange}
                  />
                );
              })
            ) : (
              <div style={{ paddingTop: 12, paddingBottom: 12 }}>
                <Empty description={emptyDescription} />
              </div>
            )}

            <Pagination
              current={current}
              pageSize={pageSize}
              total={data?.total || 0}
              hideOnSinglePage
              showSizeChanger
              showTotal={(total) => `共 ${total} 个用户`}
              onChange={(nextCurrent, nextPageSize) => {
                setCurrent(nextCurrent);
                setPageSize(nextPageSize);
              }}
              style={{ marginTop: 8, alignSelf: 'flex-end' }}
            />
          </Space>
        </Space>
      ) : (
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Input.TextArea
            value={idsInput}
            placeholder={'请输入用户 ID，例如 2,3,4'}
            rows={4}
            onChange={(event) => {
              const nextValue = event.target.value;
              setIdsInput(nextValue);
              props.onChange?.(parseIds(nextValue));
            }}
          />
          <Typography.Text type="secondary">
            支持输入多个用户 ID，使用英文逗号、中文逗号或空格分隔。当前解析{' '}
            {displayValue.length} 人。
          </Typography.Text>
        </Space>
      )}
    </Space>
  );
};

export default UserPicker;
