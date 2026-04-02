import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ProjectStatus,
  type ProjectStatusSummary,
} from '@/api/modules/project.types';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

/**
 * 列表顶部快捷状态标签。
 */
export interface ProjectQuickStatusTab {
  key: 'all' | ProjectStatus;
  label: string;
  count: number;
}

/**
 * 下拉选项结构。
 */
export interface ProjectSelectOption {
  label: string;
  value: string;
}

/**
 * 构造项目状态快捷标签。
 *
 * 这里只展示设计稿要求的三类快捷筛选，其余状态仍通过工具栏下拉完成筛选。
 *
 * @param summary 状态统计
 * @returns 快捷标签列表
 */
export function buildProjectQuickStatusTabs(
  summary?: ProjectStatusSummary,
): ProjectQuickStatusTab[] {
  return [
    {
      key: 'all',
      label: '全部项目',
      count: getStatusCount(summary, 'all'),
    },
    {
      key: ProjectStatus.InProgress,
      label: '进行中',
      count: getStatusCount(summary, 'inProgress'),
    },
    {
      key: ProjectStatus.Archived,
      label: '已归档',
      count: getStatusCount(summary, 'archived'),
    },
  ];
}

/**
 * 判断快捷状态标签是否处于激活态。
 *
 * @param currentStatus 当前筛选状态
 * @param tabKey 标签键
 * @returns 是否激活
 */
export function isQuickStatusTabActive(
  currentStatus: ProjectStatus | undefined,
  tabKey: 'all' | ProjectStatus,
) {
  if (tabKey === 'all') {
    if (currentStatus === undefined) {
      return true;
    }
    return false;
  }

  if (currentStatus === tabKey) {
    return true;
  }
  return false;
}

/**
 * 格式化项目的最近更新时间文案。
 *
 * @param value 更新时间
 * @returns 最近更新时间文案
 */
export function formatProjectUpdatedAt(value?: string) {
  if (!value) {
    return '最近更新未知';
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return '最近更新未知';
  }

  return `最近更新 ${parsed.fromNow()}`;
}

/**
 * 生成项目概况文案。
 *
 * @param value 项目概况
 * @returns 展示文案
 */
export function getProjectOverviewText(value?: string) {
  if (value) {
    return `项目概况：${value}`;
  }
  return '项目概况：暂无内容';
}

/**
 * 生成项目进展文案。
 *
 * @param value 当前进展
 * @returns 展示文案
 */
export function getProjectProgressText(value?: string) {
  if (value) {
    return `当前进展：${value}`;
  }
  return '当前进展：暂无补充说明';
}

/**
 * 生成已完成模块文案。
 *
 * @param value 已完成模块数
 * @returns 展示文案；没有值时返回空字符串
 */
export function getCompletedModuleText(value?: number) {
  if (value === undefined || value === null) {
    return '';
  }
  return `已完成模块 ${value}`;
}

/**
 * 获取空状态文案。
 *
 * @param hasFilters 是否存在筛选条件
 * @returns 空状态文案
 */
export function getProjectEmptyDescription(hasFilters: boolean) {
  if (hasFilters) {
    return '未找到符合条件的项目';
  }
  return '暂无项目数据';
}

/**
 * 构造项目分组选项。
 *
 * @param groups 后端返回的项目分组
 * @returns Select 可用选项
 */
export function buildGroupOptions(groups?: string[]): ProjectSelectOption[] {
  const options: ProjectSelectOption[] = [];
  const source = groups ?? [];

  source.forEach((item) => {
    options.push({
      label: item,
      value: item,
    });
  });

  return options;
}

/**
 * 生成底部分页文案。
 *
 * @param total 总条数
 * @param pagination 当前分页
 * @returns 底部分页文案
 */
export function buildFooterText(
  total: number,
  pagination: { current: number; pageSize: number },
) {
  let start = 0;
  let end = 0;

  if (total > 0) {
    start = (pagination.current - 1) * pagination.pageSize + 1;
    end = pagination.current * pagination.pageSize;
    if (end > total) {
      end = total;
    }
  }

  return `共 ${total} 个项目，当前展示 ${start} - ${end} 项`;
}

/**
 * 生成顶部状态按钮的视觉类型。
 *
 * @param active 是否激活
 * @returns 按钮类型
 */
export function getSummaryButtonType(active: boolean) {
  if (active) {
    return 'primary';
  }
  return 'default';
}

function getStatusCount(
  summary: ProjectStatusSummary | undefined,
  key: keyof ProjectStatusSummary,
) {
  if (!summary) {
    return 0;
  }

  const value = summary[key];
  if (value === undefined || value === null) {
    return 0;
  }
  return value;
}
