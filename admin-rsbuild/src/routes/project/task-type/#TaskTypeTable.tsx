import { useMemo, useState } from 'react';
import { Empty, Flex, Input, Space } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

import { ApiProjectTaskType } from '@/api';
import type {
  ProjectTaskType,
  ProjectTaskTypeListParams,
} from '@/api/modules/project-task-type';
import { KTable } from '@/components';
import { useKModal } from '@/components/KModal';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import queryKey from '@/constants/queryKey';
import Icons from '@/icons';

import TaskTypeForm from './#TaskTypeForm';

/**
 * 任务类型管理表格。
 */
const TaskTypeTable = () => {
  const modal = useKModal();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');

  const params = useMemo<ProjectTaskTypeListParams>(() => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return {};
    }

    return {
      name: trimmedKeyword,
    };
  }, [keyword]);

  const columns: TableColumnsType<ProjectTaskType> = [
    {
      title: '类型 ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '类型名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => {
        return (
          <Space>
            <KTable.Button
              variant={'filled'}
              color={'blue'}
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.projectTaskTypeManage}
              onClick={async () => {
                await modal.open({
                  title: '编辑任务类型',
                  width: 520,
                  children: <TaskTypeForm record={record} />,
                });
              }}
            >
              编辑
            </KTable.Button>

            <KTable.ConfirmButton
              variant={'filled'}
              color={'danger'}
              size={'small'}
              permissionCode={PERMISSION_RESOURCE.projectTaskTypeManage}
              confirmText={'删除后将无法再被新任务选择，是否继续？'}
              onConfirm={async () => {
                await ApiProjectTaskType.deleted(record.id);
                await queryClient.invalidateQueries({
                  queryKey: queryKey.project.taskTypeList(),
                });
              }}
              successText={'任务类型删除成功'}
            >
              删除
            </KTable.ConfirmButton>
          </Space>
        );
      },
    },
  ];

  return (
    <KTable<ProjectTaskType>
      queryKey={[...queryKey.project.taskTypeList(), params]}
      request={ApiProjectTaskType.getList}
      params={params}
      columns={columns}
      rowKey={'id'}
      pagination={false}
      locale={{
        emptyText: (
          <Empty description={keyword ? '未找到匹配的任务类型' : '暂无任务类型'} />
        ),
      }}
      toolbar={
        <Flex justify={'space-between'} gap={12} wrap style={{ width: '100%' }}>
          <Input.Search
            allowClear
            placeholder={'请输入类型名称搜索'}
            style={{ width: 260 }}
            onSearch={(value) => {
              setKeyword(value);
            }}
          />

          <KTable.Button
            type={'primary'}
            icon={<Icons.Plus />}
            permissionCode={PERMISSION_RESOURCE.projectTaskTypeManage}
            onClick={async () => {
              await modal.open({
                title: '新建任务类型',
                width: 520,
                children: <TaskTypeForm />,
              });
            }}
          >
            新建任务类型
          </KTable.Button>
        </Flex>
      }
    />
  );
};

export default TaskTypeTable;
