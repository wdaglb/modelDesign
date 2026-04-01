import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';

import { ApiUser } from '@/api';
import useDebounce from '@/hooks/useDebounce';

import { resolvePopupContainer } from './#projectTaskHelper';
import type { CellOption } from './#projectTaskTypes';

interface ProjectTaskAssigneeEditorProps {
  currentLabel: string;
  disabled?: boolean;
  value?: number;
  width: number;
  onCancel: () => void;
  onSave: (value?: number) => Promise<void>;
}

const QUERY_PAGE_SIZE = 20;

/**
 * 获取负责人下拉的空状态文案。
 */
function getNotFoundContent(isFetching: boolean, keyword: string) {
  if (isFetching) {
    return '搜索中...';
  }

  if (keyword) {
    return '未找到匹配用户';
  }

  return '暂无可选用户';
}

/**
 * 构造负责人下拉选项，确保当前值始终可见。
 */
function buildAssigneeOptions(
  currentLabel: string,
  currentValue: number | undefined,
  users: Awaited<ReturnType<typeof ApiUser.getPageList>>['items'],
) {
  const options: CellOption[] = [];

  if (currentValue !== undefined) {
    options.push({
      label: currentLabel,
      value: currentValue,
    });
  }

  users.forEach((user) => {
    if (user.id === currentValue) {
      return;
    }

    let optionLabel = user.nickname;

    if (!optionLabel) {
      optionLabel = user.username;
    }

    options.push({
      label: optionLabel,
      value: user.id,
    });
  });

  return options;
}

/**
 * 任务负责人内联远程搜索编辑器。
 *
 * 基于全量用户接口远程搜索，清空时表示取消负责人。
 */
const ProjectTaskAssigneeEditor = (props: ProjectTaskAssigneeEditorProps) => {
  const closingBySaveRef = useRef(false);
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(true);
  const debouncedKeyword = useDebounce(keyword, 400);

  const searchKeyword = debouncedKeyword.trim();

  const queryParams = useMemo(() => {
    const nextParams: Parameters<typeof ApiUser.getPageList>[0] = {
      current: 1,
      pageSize: QUERY_PAGE_SIZE,
    };

    if (searchKeyword) {
      nextParams.nickname = searchKeyword;
    }

    return nextParams;
  }, [searchKeyword]);

  const { data, isFetching } = useQuery({
    queryKey: ['projectTaskAssigneeSearch', queryParams],
    queryFn: () => ApiUser.getPageList(queryParams),
    enabled: open,
    placeholderData: (previousData) => previousData,
  });

  const options = useMemo(() => {
    const users = data?.items ?? [];
    return buildAssigneeOptions(props.currentLabel, props.value, users);
  }, [data?.items, props.currentLabel, props.value]);

  const handleChange = async (value?: number) => {
    closingBySaveRef.current = true;
    setOpen(false);
    await props.onSave(value);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      return;
    }

    if (closingBySaveRef.current) {
      return;
    }

    props.onCancel();
  };

  const notFoundContent = getNotFoundContent(isFetching, searchKeyword);

  return (
    <Select
      allowClear
      autoFocus
      disabled={props.disabled}
      open={open}
      options={options}
      placeholder={props.currentLabel}
      popupMatchSelectWidth={false}
      size="small"
      style={{
        width: props.width,
        maxWidth: '100%',
        display: 'inline-block',
        verticalAlign: 'top',
      }}
      variant="borderless"
      value={props.value}
      loading={isFetching}
      notFoundContent={notFoundContent}
      getPopupContainer={resolvePopupContainer}
      suffixIcon={null}
      showSearch={{
        onSearch: setKeyword,
        filterOption: false,
      }}
      styles={{
        input: {
          minHeight: 24,
          display: 'flex',
          alignItems: 'center',
          paddingInlineStart: 0,
          paddingInlineEnd: 18,
          background: 'transparent',
          boxShadow: 'none',
          whiteSpace: 'nowrap',
        },
      }}
      onChange={async (value) => {
        if (typeof value !== 'number') {
          await handleChange(undefined);
          return;
        }

        await handleChange(value);
      }}
      onOpenChange={handleOpenChange}
    />
  );
};

export default ProjectTaskAssigneeEditor;
