import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import {
  Alert,
  Button,
  DatePicker,
  Dropdown,
  Input,
  Tabs,
  Typography,
  message,
} from 'antd';

import {
  ApiProjectTask,
  ApiProjectTaskChangeLog,
  ApiProjectTaskDynamic,
  ApiUser,
} from '@/api';
import type { ProjectTaskChangeLogItem } from '@/api/modules/project-task-change-log';
import type { ProjectTaskDynamicItem } from '@/api/modules/project-task-dynamic';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import {
  TaskPriorityOptions,
  type ProjectTaskDetail,
} from '@/api/modules/project-task.types';
import type { User } from '@/api/modules/user';
import { KMarkdownPreview } from '@/components';
import queryKey from '@/constants/queryKey';
import useDebounce from '@/hooks/useDebounce';
import { copyTextToClipboard } from '@/utils';

import {
  buildAgileBoardTaskShareUrl,
  getBoardStatusText,
  getTaskAssigneeText,
  getTaskPriorityText,
  resolveTaskNumberText,
} from './#helper';
import {
  TaskDetailChip,
  TaskDetailChipLabel,
  TaskDetailChipRow,
  TaskDetailChipValue,
  TaskDetailDrawerFooterBar,
  TaskDetailDrawerScrollArea,
  TaskDetailDrawerStack,
  TaskDetailDrawerSurface,
  TaskDetailEntityCard,
  TaskDetailEntityTitle,
  TaskDetailEntityTitleStack,
  TaskDetailIdRow,
  TaskDetailPanelCard,
  TaskDetailPrimaryChip,
  TaskDetailPrimaryChipLabel,
  TaskDetailPrimaryChipValue,
  TaskDetailSubtaskCell,
  TaskDetailSubtaskHeadRow,
  TaskDetailSubtaskHint,
  TaskDetailSubtaskRow,
  TaskDetailSubtaskTable,
  TaskDetailSubtaskTitleCell,
  TaskDetailSubtaskToolbar,
  TaskDetailTabsShell,
  TaskDetailTimelineBody,
  TaskDetailTimelineItem,
  TaskDetailTimelineList,
  TaskDetailTimelineTitle,
} from './styles/task-detail-drawer.styled';
import {
  buildQuickCreateSubtaskPayload,
  resolveInitialSubtaskStatus,
} from './#taskDrawerSubtaskHelper';
import {
  buildTaskDetailSchedulePatch,
  buildTaskDetailScheduleRangeValue,
  mergeTaskDetailScheduleDraft,
  resolveTaskDetailScheduleDraft,
  type TaskDetailScheduleRangeField,
  type TaskDetailScheduleRangeValue,
} from './#taskDetailScheduleHelper';
import {
  buildEditPayload,
  resolvePopupContainer,
} from '@/routes/project/components/#projectTaskHelper';
import { buildBoardStatusOptions } from './#helper';

const RECENT_USERS_KEY = 'userSelect:recentUsers';
const RECENT_USERS_MAX = 10;

interface TaskDetailViewProps {
  /**
   * 打开完整编辑任务。
   */
  onEditTask: (task: ProjectTaskDetail) => Promise<void>;

  /**
   * 进入抽屉编辑态。
   */
  onEnterEdit: () => void;

  /**
   * 外层任务更新回调。
   */
  onTaskUpdated: () => Promise<void>;

  /**
   * demo 预置变更日志。
   */
  previewChangeLogs?: ProjectTaskChangeLogItem[];

  /**
   * demo 预置子任务。
   */
  previewSubtasks?: ProjectTaskDetail[];

  /**
   * demo 预置动态。
   */
  previewDynamics?: ProjectTaskDynamicItem[];

  /**
   * 状态配置。
   */
  statusConfigs: TaskStatusConfig[];

  /**
   * 任务详情。
   */
  task: ProjectTaskDetail;
}

/**
 * 任务详情查看态。
 *
 * 详情 Tab 只保留正文说明。
 *
 * 子任务与变更日志 Tab 已直接替换为真实接口驱动的高保真布局，
 * 不再叠加旧版 panel，避免同一信息在两个层级重复出现。
 */
const TaskDetailView = (props: TaskDetailViewProps) => {
  const [activeTabKey, setActiveTabKey] = useState('detail');
  const [openDropdown, setOpenDropdown] = useState<string>();
  const [savingField, setSavingField] = useState<string>();
  const [assigneeKeyword, setAssigneeKeyword] = useState('');
  const [draftStartTime, setDraftStartTime] = useState<Dayjs | null>(null);
  const [draftDueTime, setDraftDueTime] = useState<Dayjs | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const [dynamicContent, setDynamicContent] = useState('');
  const [creatingDynamic, setCreatingDynamic] = useState(false);
  const scheduleClosingBySaveRef = useRef(false);
  const scheduleEditedFieldRef = useRef<TaskDetailScheduleRangeField>();
  const debouncedAssigneeKeyword = useDebounce(assigneeKeyword, 300);
  const trimmedAssigneeKeyword = debouncedAssigneeKeyword.trim();
  const isAssigneeSearching = trimmedAssigneeKeyword.length > 0;

  const subtaskQuery = useQuery({
    queryKey: queryKey.project.taskChildren(props.task.id),
    queryFn: () => ApiProjectTask.getChildren(props.task.id),
    enabled: props.previewSubtasks === undefined,
  });

  const changeLogQuery = useQuery({
    queryKey: [...queryKey.project.taskChangeLog(props.task.id), 'detail-tab'],
    queryFn: () =>
      ApiProjectTaskChangeLog.getList({
        taskId: props.task.id,
        current: 1,
        pageSize: 20,
      }),
    enabled: props.previewChangeLogs === undefined,
  });

  const dynamicQuery = useQuery({
    queryKey: [...queryKey.project.taskDynamic(props.task.id), 'detail-tab'],
    queryFn: () =>
      ApiProjectTaskDynamic.getList({
        taskId: props.task.id,
        current: 1,
        pageSize: 20,
      }),
    enabled: props.previewDynamics === undefined,
  });

  const assigneeQuery = useQuery({
    queryKey: ['taskDetailAssigneeSearch', trimmedAssigneeKeyword],
    queryFn: () =>
      ApiUser.getPageList({
        keyword: trimmedAssigneeKeyword,
        current: 1,
        pageSize: 20,
      }),
    enabled: openDropdown === 'assignee' && isAssigneeSearching,
    placeholderData: (previousData) => previousData,
  });

  const subtaskItems = useMemo(() => {
    if (props.previewSubtasks !== undefined) {
      return props.previewSubtasks;
    }

    const items = subtaskQuery.data;
    if (!items) {
      return [];
    }

    return items;
  }, [props.previewSubtasks, subtaskQuery.data]);

  const changeLogItems = useMemo(() => {
    if (props.previewChangeLogs !== undefined) {
      return props.previewChangeLogs;
    }

    const items = changeLogQuery.data?.items;
    if (!items) {
      return [];
    }

    return items;
  }, [changeLogQuery.data?.items, props.previewChangeLogs]);

  const dynamicItems = useMemo(() => {
    if (props.previewDynamics !== undefined) {
      return props.previewDynamics;
    }

    const items = dynamicQuery.data?.items;
    if (!items) {
      return [];
    }

    return items;
  }, [dynamicQuery.data?.items, props.previewDynamics]);

  const taskNumberText = resolveTaskNumberText(props.task);
  const taskShareUrl = buildAgileBoardTaskShareUrl(
    props.task,
    window.location.origin,
  );
  const statusText = getBoardStatusText(props.task.status, props.statusConfigs);
  const priorityText = getTaskPriorityText(props.task.priority);
  const scheduleRangeValue = useMemo(() => {
    return buildTaskDetailScheduleRangeValue({
      startTime: draftStartTime,
      dueTime: draftDueTime,
    });
  }, [draftDueTime, draftStartTime]);
  const statusOptions = useMemo(() => {
    return buildBoardStatusOptions(props.statusConfigs, props.task.status);
  }, [props.statusConfigs, props.task.status]);
  const assigneeOptions = useMemo(() => {
    let users: User[] = [];

    if (isAssigneeSearching) {
      users = assigneeQuery.data?.items ?? [];
    } else {
      users = getRecentUsers();
    }

    const options: Array<{ id?: number; label: string }> = [
      {
        id: undefined,
        label: '未分配',
      },
    ];

    users.forEach((user: User) => {
      let label = user.nickname;
      if (!label) {
        label = user.username;
      }

      options.push({
        id: user.id,
        label,
      });
    });

    return options;
  }, [assigneeQuery.data?.items, isAssigneeSearching]);
  const priorityOptions = useMemo(() => {
    return TaskPriorityOptions.map((item) => {
      return {
        key: String(item.value),
        label: item.label,
      };
    });
  }, []);
  const statusMenuItems = useMemo(() => {
    return statusOptions.map((item) => {
      return {
        key: String(item.value),
        label: item.label,
      };
    });
  }, [statusOptions]);
  const subtaskCount = subtaskItems.length;
  const initialSubtaskStatus = useMemo(() => {
    return resolveInitialSubtaskStatus(props.statusConfigs);
  }, [props.statusConfigs]);
  const canQuickCreateSubtask =
    Boolean(subtaskTitle.trim()) &&
    Boolean(initialSubtaskStatus) &&
    !creatingSubtask &&
    props.previewSubtasks === undefined;
  const canCreateDynamic =
    Boolean(dynamicContent.trim()) &&
    !creatingDynamic &&
    props.previewDynamics === undefined;

  let changeLogCount = changeLogItems.length;
  const remoteChangeLogCount = changeLogQuery.data?.total;
  if (remoteChangeLogCount !== undefined) {
    changeLogCount = remoteChangeLogCount;
  }

  let dynamicCount = dynamicItems.length;
  const remoteDynamicCount = dynamicQuery.data?.total;
  if (remoteDynamicCount !== undefined) {
    dynamicCount = remoteDynamicCount;
  }

  const copyTaskNumber = async () => {
    try {
      await copyTextToClipboard(taskNumberText);
      message.success('任务编号已复制');
    } catch {
      message.error('任务编号复制失败，请稍后重试');
    }
  };

  const copyTaskLink = async () => {
    try {
      await copyTextToClipboard(taskShareUrl);
      message.success('任务链接已复制');
    } catch {
      message.error('任务链接复制失败，请稍后重试');
    }
  };

  /**
   * 将当前任务上的起止时间重新回填到选择器草稿。
   *
   * 关闭面板但未确认时，需要回退到服务端最新值，避免抽屉继续展示未保存草稿。
   */
  const resetScheduleDraft = () => {
    const scheduleDraft = resolveTaskDetailScheduleDraft(props.task);
    setDraftStartTime(scheduleDraft.startTime);
    setDraftDueTime(scheduleDraft.dueTime);
  };

  /**
   * 同步 RangePicker 返回的时间范围到本地草稿。
   *
   * RangePicker 允许单边为空，因此这里统一做一次空值归一化，
   * 后续保存逻辑即可继续沿用 startTime / dueTime 两个接口字段。
   */
  const syncScheduleDraft = (value?: TaskDetailScheduleRangeValue | null) => {
    const scheduleDraft = mergeTaskDetailScheduleDraft({
      currentDraft: {
        startTime: draftStartTime,
        dueTime: draftDueTime,
      },
      value,
      changedField: scheduleEditedFieldRef.current,
    });
    setDraftStartTime(scheduleDraft.startTime);
    setDraftDueTime(scheduleDraft.dueTime);
  };

  useEffect(() => {
    resetScheduleDraft();
  }, [props.task.dueTime, props.task.startTime]);

  const handleQuickCreateSubtask = async () => {
    if (!canQuickCreateSubtask || !initialSubtaskStatus) {
      return;
    }

    setCreatingSubtask(true);

    try {
      await ApiProjectTask.create(
        buildQuickCreateSubtaskPayload(
          props.task,
          subtaskTitle,
          initialSubtaskStatus,
        ),
      );
      setSubtaskTitle('');
      message.success('子任务创建成功');
      await Promise.all([
        subtaskQuery.refetch(),
        changeLogQuery.refetch(),
        props.onTaskUpdated(),
      ]);
    } catch (error) {
      message.error('子任务创建失败，请稍后重试');
      throw error;
    } finally {
      setCreatingSubtask(false);
    }
  };

  /**
   * 创建任务动态。
   *
   * 动态属于人工补充信息，不需要联动刷新任务详情主体，
   * 这里只回刷动态列表，避免无关查询重复请求。
   */
  const handleCreateDynamic = async () => {
    if (props.previewDynamics !== undefined) {
      return;
    }

    const normalizedContent = dynamicContent.trim();
    if (!normalizedContent) {
      return;
    }

    setCreatingDynamic(true);

    try {
      await ApiProjectTaskDynamic.create({
        taskId: props.task.id,
        content: normalizedContent,
      });
      setDynamicContent('');
      message.success('任务动态已发布');
      await dynamicQuery.refetch();
    } catch (error) {
      message.error('任务动态发布失败，请稍后重试');
      throw error;
    } finally {
      setCreatingDynamic(false);
    }
  };

  const saveQuickField = async (
    field: string,
    patch: Parameters<typeof buildEditPayload>[1],
  ) => {
    const savingKey = `${props.task.id}:${field}`;
    setSavingField(savingKey);

    try {
      await ApiProjectTask.edit(
        props.task.id,
        buildEditPayload(props.task, patch),
      );
      message.success('任务信息已更新');
      setOpenDropdown(undefined);
      await props.onTaskUpdated();
    } catch (error) {
      message.error('任务信息更新失败，请稍后重试');
      throw error;
    } finally {
      setSavingField(undefined);
    }
  };

  const isSavingField = (field: string) => {
    return savingField === `${props.task.id}:${field}`;
  };

  /**
   * 保存时间范围草稿。
   *
   * 使用独立标记区分“点击确定关闭”和“取消关闭”，
   * 避免 RangePicker 面板关闭时把刚确认的草稿又重置回旧值。
   */
  const saveScheduleDraft = async () => {
    scheduleClosingBySaveRef.current = true;
    scheduleEditedFieldRef.current = undefined;
    await saveQuickField(
      'schedule',
      buildTaskDetailSchedulePatch({
        startTime: draftStartTime,
        dueTime: draftDueTime,
      }),
    );
  };

  /**
   * 处理时间范围选择器的展开与收起。
   *
   * 只有用户主动取消时才回退草稿；如果是保存后关闭，则保留等待外层刷新。
   *
   * @param open 当前面板是否展开
   */
  const handleScheduleOpenChange = (open: boolean) => {
    if (open) {
      scheduleClosingBySaveRef.current = false;
      scheduleEditedFieldRef.current = undefined;
      resetScheduleDraft();
      return;
    }

    if (scheduleClosingBySaveRef.current) {
      scheduleClosingBySaveRef.current = false;
      scheduleEditedFieldRef.current = undefined;
      return;
    }

    scheduleEditedFieldRef.current = undefined;
    resetScheduleDraft();
  };

  return (
    <TaskDetailDrawerSurface>
      <TaskDetailDrawerScrollArea>
        <TaskDetailDrawerStack>
          <TaskDetailEntityCard size={'small'}>
            <TaskDetailEntityTitleStack>
              <TaskDetailIdRow>
                <Typography.Text type={'secondary'} style={{ fontSize: 10 }}>
                  {taskNumberText}
                </Typography.Text>
                <Button
                  type={'link'}
                  size={'small'}
                  style={{ padding: 0, height: 'auto' }}
                  onClick={async () => {
                    await copyTaskNumber();
                  }}
                >
                  复制编号
                </Button>
              </TaskDetailIdRow>
              <TaskDetailEntityTitle>{props.task.title}</TaskDetailEntityTitle>
            </TaskDetailEntityTitleStack>

            <TaskDetailChipRow>
              <Dropdown
                trigger={['click']}
                open={openDropdown === 'status'}
                menu={{
                  items: statusMenuItems,
                  selectable: true,
                  selectedKeys: [props.task.status],
                  onClick: async ({ key, domEvent }) => {
                    domEvent.preventDefault();
                    domEvent.stopPropagation();
                    if (String(key) === props.task.status) {
                      setOpenDropdown(undefined);
                      return;
                    }
                    await saveQuickField('status', {
                      status: String(key),
                    });
                  },
                }}
                onOpenChange={(open) => {
                  if (open) {
                    setOpenDropdown('status');
                    return;
                  }
                  setOpenDropdown(undefined);
                }}
              >
                <span style={{ display: 'inline-flex' }}>
                  <TaskDetailPrimaryChip>
                    <TaskDetailPrimaryChipLabel>
                      状态
                    </TaskDetailPrimaryChipLabel>
                    <TaskDetailPrimaryChipValue>
                      {statusText}
                    </TaskDetailPrimaryChipValue>
                  </TaskDetailPrimaryChip>
                </span>
              </Dropdown>

              <Dropdown
                trigger={['click']}
                open={openDropdown === 'priority'}
                menu={{
                  items: priorityOptions,
                  selectable: true,
                  selectedKeys: [props.task.priority],
                  onClick: async ({ key, domEvent }) => {
                    domEvent.preventDefault();
                    domEvent.stopPropagation();
                    if (String(key) === props.task.priority) {
                      setOpenDropdown(undefined);
                      return;
                    }
                    await saveQuickField('priority', {
                      priority: String(key),
                    });
                  },
                }}
                onOpenChange={(open) => {
                  if (open) {
                    setOpenDropdown('priority');
                    return;
                  }
                  setOpenDropdown(undefined);
                }}
              >
                <span style={{ display: 'inline-flex' }}>
                  <TaskDetailChip>
                    <TaskDetailChipLabel>优先级</TaskDetailChipLabel>
                    <TaskDetailChipValue>{priorityText}</TaskDetailChipValue>
                  </TaskDetailChip>
                </span>
              </Dropdown>

              <Dropdown
                trigger={['click']}
                open={openDropdown === 'assignee'}
                menu={{ items: [] }}
                popupRender={() => {
                  return (
                    <div
                      style={{
                        width: 260,
                        padding: 12,
                        borderRadius: 12,
                        background: '#ffffff',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <Input
                        value={assigneeKeyword}
                        placeholder={'输入用户名、昵称或用户 ID 搜索'}
                        onChange={(event) => {
                          setAssigneeKeyword(event.target.value);
                        }}
                      />
                      <div
                        style={{
                          marginTop: 8,
                          maxHeight: 220,
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        {assigneeQuery.isFetching ? (
                          <Typography.Text type={'secondary'}>
                            搜索中...
                          </Typography.Text>
                        ) : null}
                        {!assigneeQuery.isFetching &&
                        assigneeOptions.length === 1 ? (
                          <Typography.Text type={'secondary'}>
                            {isAssigneeSearching
                              ? '未找到用户'
                              : '暂无最近选择'}
                          </Typography.Text>
                        ) : null}
                        {assigneeOptions.map((option) => {
                          const selected = props.task.assigneeId === option.id;
                          return (
                            <button
                              key={String(option.id ?? 'unassigned')}
                              type={'button'}
                              style={{
                                textAlign: 'left',
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: selected
                                  ? '1px solid #91caff'
                                  : '1px solid transparent',
                                background: selected ? '#e6f4ff' : '#f8fafc',
                                color: '#1d2129',
                                cursor: 'pointer',
                              }}
                              onClick={async () => {
                                if (props.task.assigneeId === option.id) {
                                  setOpenDropdown(undefined);
                                  return;
                                }

                                saveSelectedAssignee(
                                  option.id,
                                  isAssigneeSearching
                                    ? (assigneeQuery.data?.items ?? [])
                                    : getRecentUsers(),
                                );
                                setOpenDropdown(undefined);
                                setAssigneeKeyword('');
                                await saveQuickField('assigneeId', {
                                  assigneeId: option.id,
                                });
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
                onOpenChange={(open) => {
                  if (open) {
                    setAssigneeKeyword('');
                    setOpenDropdown('assignee');
                    return;
                  }
                  setOpenDropdown(undefined);
                }}
              >
                <span style={{ display: 'inline-flex' }}>
                  <TaskDetailChip>
                    <TaskDetailChipLabel>负责人</TaskDetailChipLabel>
                    <TaskDetailChipValue>
                      {getTaskAssigneeText(props.task)}
                    </TaskDetailChipValue>
                  </TaskDetailChip>
                </span>
              </Dropdown>

              <TaskDetailChip>
                <TaskDetailChipLabel>时间</TaskDetailChipLabel>
                <DatePicker.RangePicker
                  allowClear
                  allowEmpty={[true, true]}
                  disabled={isSavingField('schedule')}
                  format="YYYY-MM-DD"
                  needConfirm
                  placeholder={['开始时间', '截止时间']}
                  separator={<span style={{ color: '#667085' }}>~</span>}
                  showTime
                  size="small"
                  style={{ width: 200 }}
                  suffixIcon={null}
                  value={scheduleRangeValue}
                  variant="borderless"
                  getPopupContainer={resolvePopupContainer}
                  styles={{
                    input: {
                      paddingInline: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      background: 'transparent',
                    },
                  }}
                  onChange={(value) => {
                    syncScheduleDraft(value);

                    if (value) {
                      return;
                    }

                    void saveScheduleDraft();
                  }}
                  onOk={async () => {
                    await saveScheduleDraft();
                  }}
                  onCalendarChange={(value, _, info) => {
                    if (info.range === 'start') {
                      scheduleEditedFieldRef.current = 'start';
                    }

                    if (info.range === 'end') {
                      scheduleEditedFieldRef.current = 'end';
                    }

                    syncScheduleDraft(value);
                  }}
                  onOpenChange={handleScheduleOpenChange}
                />
              </TaskDetailChip>
            </TaskDetailChipRow>
          </TaskDetailEntityCard>

          <TaskDetailTabsShell>
            <Tabs
              activeKey={activeTabKey}
              onChange={(nextKey) => {
                setActiveTabKey(nextKey);
              }}
              items={[
                {
                  key: 'detail',
                  label: '详情',
                  children: (
                    <TaskDetailDrawerStack>
                      <TaskDetailPanelCard size={'small'}>
                        {renderMarkdownPreview(props.task.description)}
                      </TaskDetailPanelCard>
                    </TaskDetailDrawerStack>
                  ),
                },
                {
                  key: 'subtask',
                  label: `子任务 ${subtaskCount}`,
                  children: (
                    <TaskDetailDrawerStack>
                      <TaskDetailPanelCard size={'small'}>
                        <TaskDetailSubtaskToolbar>
                          <TaskDetailSubtaskHint>
                            默认继承父任务负责人与优先级，可在子任务详情里继续补充。
                          </TaskDetailSubtaskHint>
                          <div
                            style={{ display: 'flex', gap: 8, minWidth: 320 }}
                          >
                            <Input
                              value={subtaskTitle}
                              disabled={
                                creatingSubtask ||
                                props.previewSubtasks !== undefined
                              }
                              placeholder={'输入子任务标题后回车创建'}
                              onChange={(event) => {
                                setSubtaskTitle(event.target.value);
                              }}
                              onPressEnter={async () => {
                                await handleQuickCreateSubtask();
                              }}
                            />
                            <Button
                              type={'primary'}
                              loading={creatingSubtask}
                              disabled={!canQuickCreateSubtask}
                              onClick={async () => {
                                await handleQuickCreateSubtask();
                              }}
                            >
                              新增子任务
                            </Button>
                          </div>
                        </TaskDetailSubtaskToolbar>
                        {renderSubtaskTable({
                          items: subtaskItems,
                          statusConfigs: props.statusConfigs,
                          isLoading: subtaskQuery.isLoading,
                          isError: subtaskQuery.isError,
                        })}
                      </TaskDetailPanelCard>
                    </TaskDetailDrawerStack>
                  ),
                },
                {
                  key: 'dynamic',
                  label: `动态 ${dynamicCount}`,
                  children: (
                    <TaskDetailDrawerStack>
                      <TaskDetailPanelCard size={'small'}>
                        <TaskDetailSubtaskToolbar>
                          <TaskDetailSubtaskHint>
                            记录任务最新进度、阻塞信息或同步说明，按时间倒序展示。
                          </TaskDetailSubtaskHint>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              minWidth: 320,
                              width: '100%',
                            }}
                          >
                            <Input.TextArea
                              value={dynamicContent}
                              disabled={props.previewDynamics !== undefined}
                              rows={4}
                              maxLength={1000}
                              placeholder={
                                '输入本次进度说明，例如：已完成联调，等待测试回归'
                              }
                              onChange={(event) => {
                                setDynamicContent(event.target.value);
                              }}
                            />
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}
                            >
                              <Button
                                type={'primary'}
                                loading={creatingDynamic}
                                disabled={!canCreateDynamic}
                                onClick={async () => {
                                  await handleCreateDynamic();
                                }}
                              >
                                发布动态
                              </Button>
                            </div>
                          </div>
                        </TaskDetailSubtaskToolbar>
                        {renderDynamicTimeline({
                          items: dynamicItems,
                          isLoading: dynamicQuery.isLoading,
                          isError: dynamicQuery.isError,
                        })}
                      </TaskDetailPanelCard>
                    </TaskDetailDrawerStack>
                  ),
                },
                {
                  key: 'changeLog',
                  label: `变更日志 ${changeLogCount}`,
                  children: (
                    <TaskDetailDrawerStack>
                      <TaskDetailPanelCard size={'small'}>
                        <Typography.Text type={'secondary'}>
                          按时间倒序展示字段改动、状态流转与系统行为。
                        </Typography.Text>
                        {renderChangeLogTimeline({
                          items: changeLogItems,
                          isLoading: changeLogQuery.isLoading,
                          isError: changeLogQuery.isError,
                        })}
                      </TaskDetailPanelCard>
                    </TaskDetailDrawerStack>
                  ),
                },
              ]}
            />
          </TaskDetailTabsShell>
        </TaskDetailDrawerStack>
      </TaskDetailDrawerScrollArea>

      <TaskDetailDrawerFooterBar>
        <div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            onClick={async () => {
              await copyTaskLink();
            }}
          >
            复制链接
          </Button>
          <Button
            type={'primary'}
            onClick={() => {
              props.onEnterEdit();
            }}
          >
            编辑任务
          </Button>
        </div>
      </TaskDetailDrawerFooterBar>
    </TaskDetailDrawerSurface>
  );
};

/**
 * 渲染日期范围。
 *
 * @param startTime 开始时间
 * @param dueTime 截止时间
 * @return 范围文本
 */
function renderDateRange(startTime?: string, dueTime?: string) {
  if (startTime && dueTime) {
    return `时间 ${startTime.slice(5, 10)} ~ ${dueTime.slice(5, 10)}`;
  }

  if (startTime) {
    return `开始 ${startTime.slice(0, 10)}`;
  }

  if (dueTime) {
    return `截止 ${dueTime.slice(0, 10)}`;
  }

  return '时间 未安排';
}

/**
 * 渲染 Markdown 预览内容。
 *
 * @param description 描述内容
 * @return 预览节点
 */
function renderMarkdownPreview(description?: string) {
  if (!description) {
    return <Typography.Text type={'secondary'}>暂无任务说明</Typography.Text>;
  }

  return <KMarkdownPreview value={description} />;
}

/**
 * 渲染子任务表格。
 *
 * @param items 子任务列表
 * @param isLoading 是否加载中
 * @param isError 是否加载失败
 * @param statusConfigs 状态配置
 * @return 预览节点
 */
function renderSubtaskTable(options: {
  isError: boolean;
  isLoading: boolean;
  items: ProjectTaskDetail[];
  statusConfigs: TaskStatusConfig[];
}) {
  if (options.isLoading) {
    return (
      <Typography.Text type={'secondary'}>子任务加载中...</Typography.Text>
    );
  }

  if (options.isError) {
    return (
      <Alert type={'error'} showIcon message={'子任务加载失败，请稍后重试。'} />
    );
  }

  if (!options.items.length) {
    return <Typography.Text type={'secondary'}>暂无子任务</Typography.Text>;
  }

  return (
    <TaskDetailSubtaskTable>
      <TaskDetailSubtaskHeadRow>
        <div>子任务</div>
        <div>状态</div>
        <div>负责人</div>
        <div>截止时间</div>
      </TaskDetailSubtaskHeadRow>
      {options.items.map((item) => {
        return (
          <TaskDetailSubtaskRow key={item.id}>
            <TaskDetailSubtaskTitleCell>
              {item.title}
            </TaskDetailSubtaskTitleCell>
            <TaskDetailSubtaskCell>
              {getBoardStatusText(item.status, options.statusConfigs)}
            </TaskDetailSubtaskCell>
            <TaskDetailSubtaskCell>
              {getTaskAssigneeText(item)}
            </TaskDetailSubtaskCell>
            <TaskDetailSubtaskCell>
              {formatDueDate(item.dueTime)}
            </TaskDetailSubtaskCell>
          </TaskDetailSubtaskRow>
        );
      })}
    </TaskDetailSubtaskTable>
  );
}

/**
 * 渲染变更日志时间线。
 *
 * @param items 变更日志
 * @param isLoading 是否加载中
 * @param isError 是否加载失败
 * @return 预览节点
 */
function renderChangeLogTimeline(options: {
  isError: boolean;
  isLoading: boolean;
  items: ProjectTaskChangeLogItem[];
}) {
  if (options.isLoading) {
    return (
      <Typography.Text type={'secondary'}>变更日志加载中...</Typography.Text>
    );
  }

  if (options.isError) {
    return (
      <Alert
        type={'error'}
        showIcon
        message={'变更日志加载失败，请稍后重试。'}
      />
    );
  }

  if (!options.items.length) {
    return <Typography.Text type={'secondary'}>暂无变更日志</Typography.Text>;
  }

  return (
    <TaskDetailTimelineList>
      {options.items.map((item) => {
        return (
          <TaskDetailTimelineItem key={item.id}>
            <TaskDetailTimelineTitle>
              {`${item.createdAt} · ${item.operatorName}`}
            </TaskDetailTimelineTitle>
            <TaskDetailTimelineBody>
              {buildChangeLogSummary(item)}
            </TaskDetailTimelineBody>
          </TaskDetailTimelineItem>
        );
      })}
    </TaskDetailTimelineList>
  );
}

/**
 * 渲染任务动态时间线。
 *
 * @param options 渲染参数
 * @return 预览节点
 */
function renderDynamicTimeline(options: {
  isError: boolean;
  isLoading: boolean;
  items: ProjectTaskDynamicItem[];
}) {
  if (options.isLoading) {
    return (
      <Typography.Text type={'secondary'}>任务动态加载中...</Typography.Text>
    );
  }

  if (options.isError) {
    return (
      <Alert
        type={'error'}
        showIcon
        message={'任务动态加载失败，请稍后重试。'}
      />
    );
  }

  if (!options.items.length) {
    return <Typography.Text type={'secondary'}>暂无任务动态</Typography.Text>;
  }

  return (
    <TaskDetailTimelineList>
      {options.items.map((item) => {
        return (
          <TaskDetailTimelineItem key={item.id}>
            <TaskDetailTimelineTitle>
              {`${item.createdAt} · ${item.operatorName}`}
            </TaskDetailTimelineTitle>
            <TaskDetailTimelineBody style={{ whiteSpace: 'pre-wrap' }}>
              {item.content}
            </TaskDetailTimelineBody>
          </TaskDetailTimelineItem>
        );
      })}
    </TaskDetailTimelineList>
  );
}

/**
 * 构造变更日志摘要。
 *
 * @param item 日志项
 * @return 摘要文本
 */
function buildChangeLogSummary(item: ProjectTaskChangeLogItem) {
  if (!item.changes.length) {
    return item.operationText;
  }

  return item.changes
    .map((change) => {
      return `${change.label}：${change.beforeValue || '-'} → ${change.afterValue || '-'}`;
    })
    .join('；');
}

/**
 * 格式化截止时间展示。
 *
 * @param dueTime 截止时间
 * @return 文本
 */
function formatDueDate(dueTime?: string) {
  if (!dueTime) {
    return '-';
  }

  if (dueTime.length >= 10) {
    return dueTime.slice(5, 10);
  }

  return dueTime;
}

/**
 * 读取最近选择的负责人列表。
 *
 * 这里与 UserSelect 复用同一个本地缓存键，确保抽屉与其它负责人选择入口
 * 默认看到的是同一批最近选择人。
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
 * 将用户写入最近选择列表。
 *
 * @param user 当前选中的用户
 */
function saveRecentUser(user: User) {
  const previous = getRecentUsers().filter((item) => item.id !== user.id);
  const next = [user, ...previous].slice(0, RECENT_USERS_MAX);
  localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(next));
}

/**
 * 根据当前候选列表回写最近负责人。
 *
 * @param assigneeId 当前选中的负责人
 * @param users 当前面板里的候选用户列表
 */
function saveSelectedAssignee(assigneeId: number | undefined, users: User[]) {
  if (assigneeId === undefined) {
    return;
  }

  const matchedUser = users.find((item) => item.id === assigneeId);
  if (!matchedUser) {
    return;
  }

  saveRecentUser(matchedUser);
}

export default TaskDetailView;
