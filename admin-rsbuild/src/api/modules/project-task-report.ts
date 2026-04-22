import request from '@/utils/request';

/**
 * 报表类型。
 */
export type ProjectTaskReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * 报表生成请求参数。
 */
export interface ProjectTaskReportParams {
  /**
   * 报表类型。
   */
  reportType: ProjectTaskReportType;

  /**
   * 参考日期。
   */
  referenceDate?: string;
}

/**
 * 报表任务项。
 */
export interface ProjectTaskReportTaskItem {
  /**
   * 任务 ID。
   */
  id: number;

  /**
   * 项目名称。
   */
  projectName?: string;

  /**
   * 任务标题。
   */
  title: string;

  /**
   * 参与身份。
   */
  participationRole: string;

  /**
   * 状态。
   */
  status: string;

  /**
   * 优先级。
   */
  priority: string;

  /**
   * 更新时间。
   */
  updatedAt?: string;

  /**
   * 最新动态摘要。
   */
  latestDynamicSummary?: string;
}

/**
 * 报表动态项。
 */
export interface ProjectTaskReportDynamicItem {
  /**
   * 任务 ID。
   */
  taskId: number;

  /**
   * 项目名称。
   */
  projectName?: string;

  /**
   * 任务标题。
   */
  taskTitle: string;

  /**
   * 发布人名称。
   */
  operatorName?: string;

  /**
   * 发布时间。
   */
  createdAt?: string;

  /**
   * 动态内容。
   */
  content: string;
}

/**
 * 报表结果。
 */
export interface ProjectTaskReportResponse {
  /**
   * 报表类型。
   */
  reportType: ProjectTaskReportType;

  /**
   * 报表标题。
   */
  reportTitle: string;

  /**
   * 区间开始时间。
   */
  periodStart: string;

  /**
   * 区间结束时间。
   */
  periodEnd: string;

  /**
   * 任务列表。
   */
  tasks: ProjectTaskReportTaskItem[];

  /**
   * 动态列表。
   */
  dynamics: ProjectTaskReportDynamicItem[];
}

/**
 * 生成任务报表。
 */
export const generate = (
  params: ProjectTaskReportParams,
): Promise<ProjectTaskReportResponse> => {
  return request('/project/task/report/generate', {
    method: 'get',
    params,
  });
};
