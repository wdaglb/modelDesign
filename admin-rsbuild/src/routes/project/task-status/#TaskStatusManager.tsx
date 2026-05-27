import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Empty,
  Input,
  Radio,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { ApiProjectTaskStatus } from '@/api';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import { PERMISSION_RESOURCE } from '@/constants/permission.ts';
import queryKey from '@/constants/queryKey';
import usePermission from '@/hooks/usePermission.ts';
import Icons from '@/icons';
import {
  type EditableTaskStatusItem,
  buildTaskStatusSaveParams,
  createEditableTaskStatuses,
  createEmptyTaskStatusItem,
  moveTaskStatusItem,
  serializeTaskStatusDrafts,
  validateTaskStatusDrafts,
} from './#taskStatusManagerHelper';

/**
 * 任务状态管理器。
 *
 * 后端采用“整表保存”模型，前端因此需要先在本地维护一份完整草稿，
 * 再统一提交新增、编辑、删除和排序结果，避免把用户每一次输入都放大成接口调用。
 */
const TaskStatusManager = () => {
  const queryClient = useQueryClient();
  const { hasButtonPermission } = usePermission();
  const nextDraftIdRef = useRef(1);
  const [draftItems, setDraftItems] = useState<EditableTaskStatusItem[]>([]);
  const [baselineSnapshot, setBaselineSnapshot] = useState('[]');
  const [saving, setSaving] = useState(false);
  const canSave = hasButtonPermission(
    PERMISSION_RESOURCE.projectTaskStatusSave,
  );
  const { data: statusConfigs = [], isLoading } = useQuery({
    queryKey: queryKey.project.taskStatusList(),
    queryFn: () => ApiProjectTaskStatus.getList(),
  });

  /**
   * 查询返回后重建草稿，确保页面初始值与保存后的服务端排序保持一致。
   */
  useEffect(() => {
    const nextDraftItems = createEditableTaskStatuses(statusConfigs);

    setDraftItems(nextDraftItems);
    setBaselineSnapshot(serializeTaskStatusDrafts(nextDraftItems));
    nextDraftIdRef.current = nextDraftItems.length + 1;
  }, [statusConfigs]);

  /**
   * 当前草稿是否存在未保存修改。
   */
  const isDirty = useMemo(() => {
    return serializeTaskStatusDrafts(draftItems) !== baselineSnapshot;
  }, [baselineSnapshot, draftItems]);

  /**
   * 更新指定行的单个字段。
   *
   * @param clientKey 草稿键
   * @param patch 需要更新的字段
   */
  const updateDraftItem = (
    clientKey: string,
    patch: Partial<EditableTaskStatusItem>,
  ) => {
    setDraftItems((previous) => {
      return previous.map((item) => {
        if (item.clientKey !== clientKey) {
          return item;
        }

        return {
          ...item,
          ...patch,
        };
      });
    });
  };

  /**
   * 设定唯一完成状态。
   *
   * @param clientKey 目标草稿键
   */
  const handleCompletedChange = (clientKey: string) => {
    setDraftItems((previous) => {
      return previous.map((item) => {
        return {
          ...item,
          isCompleted: item.clientKey === clientKey,
        };
      });
    });
  };

  /**
   * 新增一条空状态。
   */
  const handleAddStatus = () => {
    setDraftItems((previous) => {
      return [...previous, createEmptyTaskStatusItem(nextDraftIdRef.current++)];
    });
  };

  /**
   * 删除一条状态草稿。
   *
   * @param clientKey 目标草稿键
   */
  const handleDeleteStatus = (clientKey: string) => {
    setDraftItems((previous) => {
      return previous.filter((item) => item.clientKey !== clientKey);
    });
  };

  /**
   * 调整状态顺序。
   *
   * @param fromIndex 当前索引
   * @param toIndex 目标索引
   */
  const handleMoveStatus = (fromIndex: number, toIndex: number) => {
    setDraftItems((previous) => {
      return moveTaskStatusItem(previous, fromIndex, toIndex);
    });
  };

  /**
   * 重置为服务端最新配置。
   */
  const handleReset = () => {
    const nextDraftItems = createEditableTaskStatuses(statusConfigs);

    setDraftItems(nextDraftItems);
    setBaselineSnapshot(serializeTaskStatusDrafts(nextDraftItems));
    nextDraftIdRef.current = nextDraftItems.length + 1;
  };

  /**
   * 保存整表配置，并同步失效依赖当前状态配置的查询。
   */
  const handleSave = async () => {
    const validationError = validateTaskStatusDrafts(draftItems);

    if (validationError) {
      message.error(validationError);
      return;
    }

    setSaving(true);

    try {
      const savedStatuses = await ApiProjectTaskStatus.save(
        buildTaskStatusSaveParams(draftItems),
      );
      const nextDraftItems = createEditableTaskStatuses(savedStatuses);

      setDraftItems(nextDraftItems);
      setBaselineSnapshot(serializeTaskStatusDrafts(nextDraftItems));
      nextDraftIdRef.current = nextDraftItems.length + 1;

      queryClient.setQueryData<TaskStatusConfig[]>(
        queryKey.project.taskStatusList(),
        savedStatuses,
      );
      queryClient.setQueryData<TaskStatusConfig[]>(
        ['project', 'task-status-list', 'agile-board-v2'],
        savedStatuses,
      );
      await queryClient.invalidateQueries({
        queryKey: queryKey.project.taskStatusList(),
      });
      await queryClient.invalidateQueries({
        queryKey: ['project', 'task-status-list', 'agile-board-v2'],
      });
      message.success('任务状态配置已保存');
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<EditableTaskStatusItem> = [
    {
      title: '排序',
      key: 'sort',
      width: 88,
      render: (_, __, index) => {
        return index + 1;
      },
    },
    {
      title: '状态编码',
      dataIndex: 'code',
      key: 'code',
      width: 220,
      render: (value: string, record) => {
        return (
          <Input
            value={value}
            disabled={!canSave}
            placeholder={'例如 todo 或 inProgress'}
            maxLength={32}
            onChange={(event) => {
              updateDraftItem(record.clientKey, {
                code: event.target.value,
              });
            }}
          />
        );
      },
    },
    {
      title: '状态名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (value: string, record) => {
        return (
          <Input
            value={value}
            disabled={!canSave}
            placeholder={'请输入状态名称'}
            maxLength={64}
            onChange={(event) => {
              updateDraftItem(record.clientKey, {
                name: event.target.value,
              });
            }}
          />
        );
      },
    },
    {
      title: '完成状态',
      dataIndex: 'isCompleted',
      key: 'isCompleted',
      width: 140,
      render: (value: boolean, record) => {
        return (
          <Radio
            checked={value}
            disabled={!canSave}
            onChange={() => {
              handleCompletedChange(record.clientKey);
            }}
          >
            完成
          </Radio>
        );
      },
    },
    {
      title: '敏捷面板显示',
      dataIndex: 'showInAgileBoard',
      key: 'showInAgileBoard',
      width: 160,
      render: (value: boolean, record) => {
        return (
          <Switch
            checked={value}
            disabled={!canSave}
            checkedChildren={'显示'}
            unCheckedChildren={'隐藏'}
            onChange={(checked) => {
              updateDraftItem(record.clientKey, {
                showInAgileBoard: checked,
              });
            }}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record, index) => {
        const disableMoveUp = index === 0;
        const disableMoveDown = index === draftItems.length - 1;

        return (
          <Space size={8} wrap>
            <Button
              size={'small'}
              disabled={!canSave || disableMoveUp}
              onClick={() => {
                handleMoveStatus(index, index - 1);
              }}
            >
              上移
            </Button>
            <Button
              size={'small'}
              disabled={!canSave || disableMoveDown}
              onClick={() => {
                handleMoveStatus(index, index + 1);
              }}
            >
              下移
            </Button>
            <Button
              danger
              size={'small'}
              disabled={!canSave}
              onClick={() => {
                handleDeleteStatus(record.clientKey);
              }}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  if (isLoading) {
    return <Typography.Text>加载中...</Typography.Text>;
  }

  return (
    <Space orientation={'vertical'} size={16} style={{ width: '100%' }}>
      <Alert
        type={'info'}
        showIcon
        message={'配置说明'}
        description={
          '状态编码需以字母开头，可包含字母、数字、下划线和短横线；' +
          '必须且只能有一个完成状态；排序以当前列表顺序为准。'
        }
      />

      <Space wrap>
        <Button
          type={'primary'}
          icon={<Icons.Plus />}
          disabled={!canSave}
          onClick={handleAddStatus}
        >
          新增状态
        </Button>
        <Button disabled={!isDirty || saving} onClick={handleReset}>
          重置
        </Button>
        <Button
          type={'primary'}
          disabled={!canSave || !isDirty}
          loading={saving}
          onClick={() => {
            void handleSave();
          }}
        >
          保存配置
        </Button>
      </Space>

      <Table<EditableTaskStatusItem>
        rowKey={'clientKey'}
        pagination={false}
        columns={columns}
        dataSource={draftItems}
        locale={{
          emptyText: <Empty description={'暂无任务状态，请先新增'} />,
        }}
      />
    </Space>
  );
};

export default TaskStatusManager;
