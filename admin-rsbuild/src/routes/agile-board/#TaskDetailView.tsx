import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import {
  Alert,
  Button,
  DatePicker,
  Dropdown,
  Input,
  type InputRef,
  Mentions,
  Modal,
  Select,
  Tag,
  Tabs,
  Typography,
  message,
} from 'antd';

import {
  ApiProjectTask,
  ApiProjectTaskChangeLog,
  ApiProjectTaskDynamic,
  ApiProjectTaskType,
  ApiUser,
} from '@/api';
import type { ProjectTaskChangeLogItem } from '@/api/modules/project-task-change-log';
import type { ProjectTaskDynamicItem } from '@/api/modules/project-task-dynamic';
import type { ProjectTaskIteration } from '@/api/modules/project-task-iteration';
import type { TaskStatusConfig } from '@/api/modules/project-task-status';
import {
  TaskPriorityOptions,
  type ProjectTaskDetail,
} from '@/api/modules/project-task.types';
import type { User } from '@/api/modules/user';
import { KMarkdownPreview } from '@/components';
import { resolveTaskTypeTagTone } from '@/components/business/task-card/TaskCard';
import queryKey from '@/constants/queryKey';
import useDebounce from '@/hooks/useDebounce';

import {
  getBoardStatusText,
  getTaskAssigneeText,
  getTaskPriorityText,
  resolveTaskNumberText,
} from './#helper';
import useAuthStore from '@/store/auth.ts';
import {
  TaskDetailChip,
  TaskDetailChipLabel,
  TaskDetailChipRow,
  TaskDetailChipValue,
  TaskDetailDrawerFooterBar,
  TaskDetailDrawerScrollArea,
  TaskDetailDrawerStack,
  TaskDetailDrawerSurface,
  TaskDetailEntityCopyableTitle,
  TaskDetailEntityCard,
  TaskDetailEntityTitle,
  TaskDetailEntityTitleStack,
  TaskDetailIdRow,
  TaskDetailPanelCard,
  TaskDetailPrimaryChip,
  TaskDetailPrimaryChipLabel,
  TaskDetailPrimaryChipValue,
  TaskDetailSubtaskHint,
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
import type { TaskPreviewDrawerTabKey } from './#previewDrawerService';
import {
  buildTaskDetailTypeMenuItems,
  getTaskBranchUnavailableMessage,
  resolveTaskBranchName,
  resolveTaskBranchUnavailableReason,
  resolveTaskDetailTypeText,
} from './#taskDetailTypeHelper';
import {
  buildTaskDetailSchedulePatch,
  buildTaskDetailScheduleRangeValue,
  mergeTaskDetailScheduleDraft,
  resolveTaskDetailScheduleDraft,
  type TaskDetailScheduleRangeField,
  type TaskDetailScheduleRangeValue,
} from './#taskDetailScheduleHelper';
import TaskDetailSubtaskTableSection, {
  type TaskDetailSubtaskEditableField,
  type TaskDetailSubtaskEditingCell,
} from './#TaskDetailSubtaskTable';
import {
  buildEditPayload,
  normalizeAssigneeValue,
  normalizeDateValue,
  normalizeTaskStatus,
  resolvePopupContainer,
} from '@/routes/project/components/#projectTaskHelper';
import { buildBoardStatusOptions } from './#helper';

const RECENT_USERS_KEY = 'userSelect:recentUsers';
const RECENT_USERS_MAX = 10;
const DYNAMIC_MENTION_PATTERN =
  /@[^\s@，。；、,.!?！？:："“”"'‘’<>\[\]{}]+(?:（[^）\s]+）|\([^)\s]+\))?/g;

/**
 * 组装动态 @ 用户时插入到正文中的文本。
 *
 * 当前后端动态接口仍然只保存纯文本内容，因此这里优先兼顾可读性与弱唯一性：
 * - 有昵称且昵称与用户名不同：插入“昵称（用户名）”
 * - 其他情况：回退为用户名
 *
 * 这样可以避免重名昵称场景下正文完全无法区分，同时又不引入新的后端结构。
 *
 * @param user 用户信息
 * @return Mentions 组件要插入的文本
 */
function buildDynamicMentionValue(user: User) {
  const nickname = user.nickname?.trim();
  const username = user.username.trim();
  if (nickname && nickname !== username) {
    return `${nickname}（${username}）`;
  }
  return username;
}

/**
 * 将用户列表转换为动态 @ 用户下拉候选项。
 *
 * 这里复用统一用户搜索接口返回的数据，不额外定义新的视图模型，
 * 让动态输入与系统内其他用户搜索场景保持一致的数据来源。
 *
 * @param users 用户列表
 * @return Mentions 候选项
 */
function buildDynamicMentionOptions(users: User[]) {
  return users.map((user) => {
    const mentionValue = buildDynamicMentionValue(user);

    return {
      key: String(user.id),
      value: mentionValue,
      label: `${mentionValue} · ID ${user.id}`,
    };
  });
}

/**
 * 根据当前正文与已选择的 mention 用户，反推出本次发布仍然有效的用户 ID。
 *
 * 这里不直接信任“曾经选中过谁”，而是以正文里是否仍然存在对应的 @ 文本为准，
 * 避免用户手动删除 mention 文本后，后台仍收到过期的通知目标。
 *
 * @param content 当前动态正文
 * @param mentionedUsers 当前编辑态记录的 mention 用户
 * @return 仍然有效的用户 ID 集合
 */
function resolveDynamicMentionedUserIds(
  content: string,
  mentionedUsers: User[],
) {
  const mentionedUserIds = new Set<number>();

  for (const user of mentionedUsers) {
    const mentionText = `@${buildDynamicMentionValue(user)}`;
    if (!content.includes(mentionText)) {
      continue;
    }
    mentionedUserIds.add(user.id);
  }

  return Array.from(mentionedUserIds);
}

/**
 * 将动态正文解析为普通文本与 @ 用户片段。
 *
 * 目前任务动态仍以纯文本存储，因此只能依赖文本规则识别 mention。
 * 这里优先匹配当前输入组件实际插入的“@昵称（用户名）”格式，同时兼容常见的“@用户名”。
 *
 * @param content 动态正文
 * @return 可直接渲染的节点片段
 */
function renderDynamicContentWithMentionHighlight(content: string) {
  const nodes: JSX.Element[] = [];
  let startIndex = 0;

  for (const match of content.matchAll(DYNAMIC_MENTION_PATTERN)) {
    const matchedText = match[0];
    const matchedIndex = match.index;

    if (matchedIndex === undefined) {
      continue;
    }

    if (matchedIndex > startIndex) {
      nodes.push(
        <Typography.Text key={`text-${startIndex}`}>
          {content.slice(startIndex, matchedIndex)}
        </Typography.Text>,
      );
    }

    nodes.push(
      <Tag
        key={`mention-${matchedIndex}`}
        color={'processing'}
        style={{ marginInlineEnd: 4 }}
      >
        {matchedText}
      </Tag>,
    );
    startIndex = matchedIndex + matchedText.length;
  }

  if (!nodes.length) {
    return content;
  }

  if (startIndex < content.length) {
    nodes.push(
      <Typography.Text key={`text-${startIndex}`}>
        {content.slice(startIndex)}
      </Typography.Text>,
    );
  }

  return nodes;
}

interface TaskDetailViewProps {
  /**
   * 抽屉首次打开时默认激活的 Tab。
   */
  initialTabKey?: TaskPreviewDrawerTabKey;

  /**
   * 当前看板已加载的迭代列表。
   *
   * 详情抽屉的快捷修改应与看板筛选使用同一份迭代配置，
   * 避免用户看到的“当前迭代”与可选择范围出现短暂不一致。
   */
  iterations?: ProjectTaskIteration[];

  /**
   * 打开关联任务详情。
   *
   * 当前用于在主任务详情里继续打开子任务详情抽屉，保持详情链路一致。
   */
  onEditTask: (task: ProjectTaskDetail) => Promise<void>;

  /**
   * 打开统一任务编辑窗口。
   */
  onEnterEdit: () => Promise<void> | void;

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
  const [activeTabKey, setActiveTabKey] = useState<TaskPreviewDrawerTabKey>(
    props.initialTabKey ?? 'detail',
  );
  const [openDropdown, setOpenDropdown] = useState<string>();
  const [savingField, setSavingField] = useState<string>();
  const [assigneeKeyword, setAssigneeKeyword] = useState('');
  const [draftStartTime, setDraftStartTime] = useState<Dayjs | null>(null);
  const [draftDueTime, setDraftDueTime] = useState<Dayjs | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [creatingSubtask, setCreatingSubtask] = useState(false);
  const [dynamicContent, setDynamicContent] = useState('');
  const [creatingDynamic, setCreatingDynamic] = useState(false);
  const [deletingSubtaskId, setDeletingSubtaskId] = useState<number>();
  const [detailDescription, setDetailDescription] = useState(
    props.task.description || '',
  );
  const [editingSubtaskCell, setEditingSubtaskCell] =
    useState<TaskDetailSubtaskEditingCell | null>(null);
  const [dynamicMentionUsers, setDynamicMentionUsers] = useState<User[]>([]);
  const [dynamicMentionKeyword, setDynamicMentionKeyword] = useState<
    string | undefined
  >(undefined);
  const scheduleClosingBySaveRef = useRef(false);
  const scheduleEditedFieldRef = useRef<TaskDetailScheduleRangeField>();
  const subtaskTitleInputRef = useRef<InputRef | null>(null);
  const shouldRefocusSubtaskInputRef = useRef(false);
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

  useEffect(() => {
    setDetailDescription(props.task.description || '');
  }, [props.task.description, props.task.id]);

  const dynamicMentionUserQuery = useQuery({
    queryKey: ['taskDetailDynamicMentionSearch', dynamicMentionKeyword],
    queryFn: () => {
      const trimmedKeyword = dynamicMentionKeyword?.trim();

      return ApiUser.getPageList({
        keyword: trimmedKeyword || undefined,
        current: 1,
        pageSize: 10,
      });
    },
    enabled:
      props.previewDynamics === undefined &&
      dynamicMentionKeyword !== undefined,
    placeholderData: (previousData) => previousData,
  });

  const assigneeQuery = useQuery({
    queryKey: ['taskDetailAssigneeSearch', trimmedAssigneeKeyword],
    queryFn: () =>
      ApiUser.getPageList({
        keyword: trimmedAssigneeKeyword,
        current: 1,
        pageSize: 20,
        isDisable: false,
      }),
    enabled: openDropdown === 'assignee' && isAssigneeSearching,
    placeholderData: (previousData) => previousData,
  });

  const taskTypeQuery = useQuery({
    queryKey: queryKey.project.taskTypeList(),
    queryFn: () => ApiProjectTaskType.getList(),
    /**
     * 分支名生成同样依赖任务类型上的前缀分组配置，
     * 因此当前任务已有 typeId 时也需要预先拿到类型列表，
     * 不能只在用户展开类型下拉时再请求。
     */
    enabled: openDropdown === 'type' || Boolean(props.task.typeId),
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
  const dynamicMentionOptions = useMemo(() => {
    const users = dynamicMentionUserQuery.data?.items;
    if (!users) {
      return [];
    }

    return buildDynamicMentionOptions(users);
  }, [dynamicMentionUserQuery.data?.items]);
  const dynamicMentionUserMap = useMemo(() => {
    const users = dynamicMentionUserQuery.data?.items;
    const nextMap = new Map<string, User>();

    if (!users) {
      return nextMap;
    }

    for (const user of users) {
      nextMap.set(buildDynamicMentionValue(user), user);
    }

    return nextMap;
  }, [dynamicMentionUserQuery.data?.items]);
  let dynamicMentionNotFoundContent = '未找到可插入的用户';
  if (dynamicMentionUserQuery.isFetching) {
    dynamicMentionNotFoundContent = '搜索用户中...';
  }

  const currentInfo = useAuthStore((state) => state.currentInfo);
  const taskNumberText = resolveTaskNumberText(props.task);
  /**
   * 所属项目优先展示后端已组装的项目名称。
   *
   * 敏捷面板详情可能从分享链接、子任务列表等入口打开，部分旧数据或轻量接口
   * 只带 projectId，因此这里保留 ID 兜底，避免抽屉顶部出现空白上下文。
   */
  const projectDisplayText = useMemo(() => {
    if (props.task.projectName) {
      return props.task.projectName;
    }

    return `项目 #${props.task.projectId}`;
  }, [props.task.projectId, props.task.projectName]);
  const parentTaskLinkText = useMemo(() => {
    if (props.task.parentTaskId === undefined || props.task.parentTaskId === null) {
      return undefined;
    }

    if (props.task.parentTaskTitle) {
      return props.task.parentTaskTitle;
    }

    return `父任务 #${props.task.parentTaskId}`;
  }, [props.task.parentTaskId, props.task.parentTaskTitle]);
  const statusText = getBoardStatusText(props.task.status, props.statusConfigs);
  const priorityText = getTaskPriorityText(props.task.priority);
  const typeText = useMemo(() => {
    return resolveTaskDetailTypeText(props.task, taskTypeQuery.data);
  }, [props.task, taskTypeQuery.data]);
  /**
   * 标题区的类型标签需要与敏捷面板任务卡片保持一致的视觉语义。
   *
   * 当任务还未设置类型时，仍然保留一个中性 Tag，避免用户失去
   * 在标题区直接感知并修改类型的入口。
   */
  const titleTypeTone = useMemo(() => {
    if (typeText === '未设置') {
      return {
        background: '#f5f5f5',
        borderColor: '#d9d9d9',
        textColor: '#595959',
      };
    }

    return resolveTaskTypeTagTone(typeText);
  }, [typeText]);
  const taskBranchName = useMemo(() => {
    return resolveTaskBranchName(
      props.task,
      currentInfo?.gitUsername,
      taskTypeQuery.data,
    );
  }, [currentInfo?.gitUsername, props.task, taskTypeQuery.data]);
  const iterationOptions = useMemo(() => {
    const sourceIterations = props.iterations ?? [];
    const options = sourceIterations.map((item) => {
      return {
        label: item.name,
        value: item.id,
      };
    });

    if (props.task.iterationId === undefined || props.task.iterationId === null) {
      return options;
    }

    const iterationExists = sourceIterations.some((item) => {
      return item.id === props.task.iterationId;
    });
    if (iterationExists) {
      return options;
    }

    return [
      ...options,
      {
        label: props.task.iterationName || `迭代#${props.task.iterationId}`,
        value: props.task.iterationId,
        disabled: true,
      },
    ];
  }, [props.iterations, props.task.iterationId, props.task.iterationName]);
  const taskBranchUnavailableMessage = useMemo(() => {
    return getTaskBranchUnavailableMessage(
      resolveTaskBranchUnavailableReason(
        props.task,
        currentInfo?.gitUsername,
        taskTypeQuery.data,
      ),
    );
  }, [currentInfo?.gitUsername, props.task, taskTypeQuery.data]);
  const scheduleRangeValue = useMemo(() => {
    return buildTaskDetailScheduleRangeValue({
      startTime: draftStartTime,
      dueTime: draftDueTime,
    });
  }, [draftDueTime, draftStartTime]);

  /**
   * 同一抽屉在切换任务或切换默认入口时，应回到预期的起始 Tab。
   */
  useEffect(() => {
    setActiveTabKey(props.initialTabKey ?? 'detail');
  }, [props.initialTabKey, props.task.id]);

  const statusOptions = useMemo(() => {
    return buildBoardStatusOptions(props.statusConfigs, props.task.status);
  }, [props.statusConfigs, props.task.status]);
  const assigneeOptions = useMemo(() => {
    let users: User[] = [];

    if (isAssigneeSearching) {
      users = assigneeQuery.data?.items ?? [];
    } else {
      users = getRecentUsers().filter((item) => !item.isDisable);
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

    if (
      props.task.assigneeId !== undefined &&
      !options.some((item) => item.id === props.task.assigneeId)
    ) {
      options.push({
        id: props.task.assigneeId,
        label: props.task.assignee || `用户 #${props.task.assigneeId}`,
      });
    }

    return options;
  }, [
    assigneeQuery.data?.items,
    isAssigneeSearching,
    props.task.assignee,
    props.task.assigneeId,
  ]);
  const priorityOptions = useMemo(() => {
    return TaskPriorityOptions.map((item) => {
      return {
        key: String(item.value),
        label: item.label,
      };
    });
  }, []);
  const typeMenuItems = useMemo(() => {
    return buildTaskDetailTypeMenuItems(props.task, taskTypeQuery.data);
  }, [props.task, taskTypeQuery.data]);
  const typeSelectedKeys = useMemo(() => {
    if (props.task.typeId === undefined || props.task.typeId === null) {
      return [];
    }

    return [String(props.task.typeId)];
  }, [props.task.typeId]);
  const statusMenuItems = useMemo(() => {
    return statusOptions.map((item) => {
      return {
        key: String(item.value),
        label: item.label,
      };
    });
  }, [statusOptions]);
  let titleTypeTagNode = null;
  if (titleTypeTone) {
    titleTypeTagNode = (
      <Dropdown
        trigger={['click']}
        open={openDropdown === 'type'}
        menu={{
          items: typeMenuItems,
          selectable: true,
          selectedKeys: typeSelectedKeys,
          onClick: async ({ key, domEvent }) => {
            domEvent.preventDefault();
            domEvent.stopPropagation();

            const nextTypeId = Number(key);
            if (Number.isNaN(nextTypeId)) {
              setOpenDropdown(undefined);
              return;
            }

            if (props.task.typeId === nextTypeId) {
              setOpenDropdown(undefined);
              return;
            }

            await saveQuickField('typeId', {
              typeId: nextTypeId,
            });
          },
        }}
        onOpenChange={(open) => {
          if (open) {
            setOpenDropdown('type');
            return;
          }
          setOpenDropdown(undefined);
        }}
      >
        <Tag
          style={{
            marginInlineEnd: 0,
            cursor: 'pointer',
            background: titleTypeTone.background,
            borderColor: titleTypeTone.borderColor,
            color: titleTypeTone.textColor,
          }}
        >
          {typeText}
        </Tag>
      </Dropdown>
    );
  }
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

  /**
   * 子任务快捷创建成功后重新聚焦输入框，便于用户连续录入多条子任务。
   *
   * 这里不能在创建成功分支里直接 focus，因为提交期间输入框处于 disabled，
   * 需要等 `creatingSubtask` 回落后再执行聚焦。
   */
  useEffect(() => {
    if (creatingSubtask) {
      return;
    }

    if (!shouldRefocusSubtaskInputRef.current) {
      return;
    }

    shouldRefocusSubtaskInputRef.current = false;
    window.requestAnimationFrame(() => {
      subtaskTitleInputRef.current?.focus();
    });
  }, [creatingSubtask]);

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
      shouldRefocusSubtaskInputRef.current = true;
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
   * 开始编辑子任务快捷字段。
   *
   * @param taskId 子任务 ID
   * @param field 快捷字段名
   */
  const startEditSubtaskCell = (
    taskId: number,
    field: TaskDetailSubtaskEditableField,
  ) => {
    if (savingField) {
      return;
    }

    setEditingSubtaskCell({
      taskId,
      field,
    });
  };

  /**
   * 关闭子任务快捷编辑态。
   */
  const closeEditingSubtaskCell = () => {
    setEditingSubtaskCell(null);
  };

  /**
   * 保存子任务快捷字段。
   *
   * 子任务列表接口返回的是列表视图模型，不保证包含编辑接口需要的完整字段。
   * 这里先补拉一次详情，再基于完整快照合成 patch，避免把未回传字段覆盖为空。
   *
   * @param task 子任务列表项
   * @param field 字段名
   * @param patch 变更补丁
   */
  const saveSubtaskField = async (
    task: ProjectTaskDetail,
    field: TaskDetailSubtaskEditableField,
    patch: Parameters<typeof buildEditPayload>[1],
  ) => {
    const savingKey = `${task.id}:${field}`;
    setSavingField(savingKey);

    try {
      const detailTask = await ApiProjectTask.getDetail(task.id);

      await ApiProjectTask.edit(
        task.id,
        buildEditPayload(detailTask, patch),
      );
      message.success('子任务已更新');
      closeEditingSubtaskCell();
      await Promise.all([subtaskQuery.refetch(), props.onTaskUpdated()]);
    } catch (error) {
      message.error('子任务更新失败，请稍后重试');
      throw error;
    } finally {
      setSavingField(undefined);
    }
  };

  /**
   * 保存子任务标题。
   *
   * @param task 子任务
   * @param value 标题
   */
  const handleSubtaskTitleSave = async (
    task: ProjectTaskDetail,
    value: string,
  ) => {
    const normalizedValue = value.trim();

    if (!normalizedValue || normalizedValue === task.title.trim()) {
      closeEditingSubtaskCell();
      return;
    }

    await saveSubtaskField(task, 'title', {
      title: normalizedValue,
    });
  };

  /**
   * 保存子任务状态。
   *
   * @param task 子任务
   * @param value 新状态
   */
  const handleSubtaskStatusSave = async (
    task: ProjectTaskDetail,
    value?: string | number,
  ) => {
    const nextStatus = normalizeTaskStatus(value);

    if (!nextStatus || nextStatus === task.status) {
      closeEditingSubtaskCell();
      return;
    }

    await saveSubtaskField(task, 'status', {
      status: nextStatus,
    });
  };

  /**
   * 保存子任务负责人。
   *
   * @param task 子任务
   * @param value 负责人值
   */
  const handleSubtaskAssigneeSave = async (
    task: ProjectTaskDetail,
    value?: string | number,
  ) => {
    const nextAssigneeId = normalizeAssigneeValue(value);
    let nextAssigneePayload = nextAssigneeId;

    if (nextAssigneeId === task.assigneeId) {
      closeEditingSubtaskCell();
      return;
    }

    if (value === undefined) {
      nextAssigneePayload = 0;
    }

    await saveSubtaskField(task, 'assigneeId', {
      assigneeId: nextAssigneePayload,
    });
  };

  /**
   * 保存子任务截止时间。
   *
   * @param task 子任务
   * @param value 截止时间
   */
  const handleSubtaskDueTimeSave = async (
    task: ProjectTaskDetail,
    value?: string,
  ) => {
    const normalizedValue = normalizeDateValue(value);
    const currentValue = normalizeDateValue(task.dueTime);

    if (normalizedValue === currentValue) {
      closeEditingSubtaskCell();
      return;
    }

    await saveSubtaskField(task, 'dueTime', {
      dueTime: normalizedValue,
    });
  };

  /**
   * 打开子任务详情。
   *
   * 详情态承载子任务操作入口，因此这里交给外层继续打开任务详情抽屉，
   * 避免“查看详情”错误跳转到完整编辑表单。
   *
   * @param task 子任务
   */
  const handleOpenSubtaskDetail = async (task: ProjectTaskDetail) => {
    await props.onEditTask(task);
  };

  /**
   * 打开当前子任务关联的父任务详情。
   *
   * 当前详情对象只需要父任务 ID 和标题即可让外层抽屉重新请求详情，
   * 其它字段在这里只作为类型兜底，不参与真实展示。
   */
  const handleOpenParentTaskDetail = async () => {
    if (props.task.parentTaskId === undefined || props.task.parentTaskId === null) {
      return;
    }

    await props.onEditTask({
      id: props.task.parentTaskId,
      projectId: props.task.projectId,
      projectCode: props.task.projectCode,
      title: parentTaskLinkText || `父任务 #${props.task.parentTaskId}`,
      status: props.task.status,
      priority: props.task.priority,
    });
  };

  /**
   * 删除子任务并刷新详情态数据。
   *
   * 删除成功后需要同步回刷子任务列表和主任务详情，避免抽屉内计数与最新状态残留。
   *
   * @param task 子任务
   */
  const handleDeleteSubtask = async (task: ProjectTaskDetail) => {
    if (props.previewSubtasks !== undefined) {
      return;
    }

    Modal.confirm({
      title: '确认删除子任务？',
      content: `删除后不可恢复，子任务「${task.title}」将被移除。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
      onOk: async () => {
        setDeletingSubtaskId(task.id);

        try {
          await ApiProjectTask.deleted([task.id]);
          message.success('子任务删除成功');
          closeEditingSubtaskCell();
          await Promise.all([subtaskQuery.refetch(), props.onTaskUpdated()]);
        } catch (error) {
          message.error('子任务删除失败，请稍后重试');
          throw error;
        } finally {
          setDeletingSubtaskId(undefined);
        }
      },
    });
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
      const mentionedUserIds = resolveDynamicMentionedUserIds(
        normalizedContent,
        dynamicMentionUsers,
      );
      await ApiProjectTaskDynamic.create({
        taskId: props.task.id,
        content: normalizedContent,
        mentionedUserIds,
      });
      setDynamicContent('');
      setDynamicMentionUsers([]);
      setDynamicMentionKeyword(undefined);
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

  /**
   * 保存任务当前迭代。
   *
   * Ant Design Select 清空时会返回 undefined。后端将空迭代识别为取消绑定，
   * 因此这里必须显式把 iterationId 写进 patch，而不是依赖默认合并逻辑。
   *
   * @param value 新迭代 ID；undefined 表示清空迭代
   */
  const saveTaskIteration = async (value?: number) => {
    if (props.task.iterationId === value) {
      return;
    }

    await saveQuickField('iterationId', {
      iterationId: value,
    });
  };

  /**
   * 保存详情区 Markdown 待办切换结果。
   *
   * 这里保持“预览交互在组件内、持久化在页面层”的职责边界：
   * - 组件内部产出切换后的完整 Markdown
   * - 详情页负责即时保存、失败回滚与刷新外层数据
   */
  const handleMarkdownTodoToggle = async (nextValue: string) => {
    const previousValue = detailDescription;
    setDetailDescription(nextValue);

    try {
      await saveQuickField('description', {
        description: nextValue,
      });
    } catch (error) {
      setDetailDescription(previousValue);
      throw error;
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
                <Typography.Text
                  copyable={{ text: taskNumberText }}
                  style={{ color: '#4e5969', fontSize: 10 }}
                >
                  {taskNumberText}
                </Typography.Text>
                {taskBranchName ? (
                  <Typography.Text
                    copyable={{ text: taskBranchName }}
                    style={{ color: '#4e5969', fontSize: 10 }}
                  >
                    {taskBranchName}
                  </Typography.Text>
                ) : (
                  <Typography.Text type={'warning'} style={{ fontSize: 10 }}>
                    {taskBranchUnavailableMessage}
                  </Typography.Text>
                )}
                <span style={{ flex: 1, minWidth: 16 }} />
                <Select<number>
                  allowClear
                  disabled={isSavingField('iterationId')}
                  loading={isSavingField('iterationId')}
                  options={iterationOptions}
                  placeholder={'未设置迭代'}
                  popupMatchSelectWidth={false}
                  size={'small'}
                  style={{ minWidth: 120 }}
                  value={props.task.iterationId ?? undefined}
                  variant={'borderless'}
                  showSearch={{
                    optionFilterProp: 'label',
                  }}
                  onChange={(value) => {
                    void saveTaskIteration(value);
                  }}
                />
              </TaskDetailIdRow>
              {parentTaskLinkText && (
                <Typography.Link
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    void handleOpenParentTaskDetail();
                  }}
                >
                  {`父任务：${parentTaskLinkText}`}
                </Typography.Link>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {titleTypeTagNode}
                <TaskDetailEntityCopyableTitle copyable={{ text: props.task.title }}>
                  <TaskDetailEntityTitle>{props.task.title}</TaskDetailEntityTitle>
                </TaskDetailEntityCopyableTitle>
              </div>
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
                                cursor: selected ? 'default' : 'pointer',
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
            <div>
              <TaskDetailChip>
                <TaskDetailChipLabel>所属项目</TaskDetailChipLabel>
                <TaskDetailChipValue>{projectDisplayText}</TaskDetailChipValue>
              </TaskDetailChip>
            </div>
          </TaskDetailEntityCard>

          <TaskDetailTabsShell>
            <Tabs
              activeKey={activeTabKey}
              onChange={(nextKey) => {
                setActiveTabKey(nextKey as TaskPreviewDrawerTabKey);
              }}
              items={[
                {
                  key: 'detail',
                  label: '详情',
                  children: (
                    <TaskDetailDrawerStack>
                      <TaskDetailPanelCard size={'small'}>
                        {renderMarkdownPreview({
                          description: detailDescription,
                          onTodoToggle: handleMarkdownTodoToggle,
                        })}
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
                              ref={subtaskTitleInputRef}
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
                        <TaskDetailSubtaskTableSection
                          deletingTaskId={deletingSubtaskId}
                          disabled={props.previewSubtasks !== undefined}
                          editingCell={editingSubtaskCell}
                          isError={subtaskQuery.isError}
                          isLoading={subtaskQuery.isLoading}
                          items={subtaskItems}
                          onDelete={handleDeleteSubtask}
                          onOpenDetail={handleOpenSubtaskDetail}
                          savingCellKey={savingField}
                          statusConfigs={props.statusConfigs}
                          onAssigneeSave={handleSubtaskAssigneeSave}
                          onCloseEditingCell={closeEditingSubtaskCell}
                          onDueTimeSave={handleSubtaskDueTimeSave}
                          onStartEditCell={startEditSubtaskCell}
                          onStatusSave={handleSubtaskStatusSave}
                          onTitleSave={handleSubtaskTitleSave}
                        />
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
                            <Mentions
                              value={dynamicContent}
                              disabled={props.previewDynamics !== undefined}
                              rows={4}
                              maxLength={1000}
                              prefix={['@']}
                              options={dynamicMentionOptions}
                              placeholder={
                                '输入本次进度说明，输入 @ 可自动搜索并插入用户'
                              }
                              notFoundContent={
                                dynamicMentionNotFoundContent
                              }
                              onChange={(value) => {
                                setDynamicContent(value);
                              }}
                              onSearch={(text, prefix) => {
                                if (prefix !== '@') {
                                  return;
                                }
                                setDynamicMentionKeyword(text);
                              }}
                              onSelect={(option: { value: string }) => {
                                const selectedUser = dynamicMentionUserMap.get(
                                  option.value,
                                );
                                if (!selectedUser) {
                                  return;
                                }

                                setDynamicMentionUsers((previousUsers) => {
                                  const nextUsers = previousUsers.filter(
                                    (item) => item.id !== selectedUser.id,
                                  );
                                  return [...nextUsers, selectedUser];
                                });
                              }}
                            />
                            <Typography.Text type={'secondary'}>
                              输入 @ 可搜索用户，选中后会把用户标识插入到动态正文。
                            </Typography.Text>
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
            type={'primary'}
            onClick={async () => {
              await props.onEnterEdit();
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
 * @param options 预览参数
 * @return 预览节点
 */
function renderMarkdownPreview(options: {
  description?: string;
  onTodoToggle?: (nextValue: string) => Promise<void>;
}) {
  if (!options.description) {
    return <Typography.Text type={'secondary'}>暂无任务说明</Typography.Text>;
  }

  return (
    <KMarkdownPreview
      value={options.description}
      onTodoToggle={async (payload) => {
        await options.onTodoToggle?.(payload.nextValue);
      }}
    />
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
            <TaskDetailTimelineBody
              style={{
                whiteSpace: 'pre-wrap',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                alignItems: 'center',
              }}
            >
              {renderDynamicContentWithMentionHighlight(item.content)}
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
  /**
   * 创建任务属于“初始化记录”，这里按产品要求收敛为单条摘要，
   * 避免把初始字段逐项渲染成“字段变更”，误导用户认为发生了逐字段编辑。
   */
  if (item.operationType === 'create') {
    return item.operationText;
  }

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
