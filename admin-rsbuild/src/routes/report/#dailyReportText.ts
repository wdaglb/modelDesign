import type {
  ProjectTaskReportResponse,
  ProjectTaskReportTaskItem,
} from '@/api/modules/project-task-report';

const chineseSectionNumbers = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
];

/**
 * 构造日报文本。
 *
 * 这里按“项目 -> 任务”分组输出，便于用户直接复制到 IM、邮件或日报系统。
 * 若任务未完成且存在最新动态摘要，则在状态后追加动态说明，贴合当前日报口径。
 *
 * @param report 日报结果
 * @returns 可复制的日报文本
 */
export function buildDailyReportText(report: ProjectTaskReportResponse): string {
  const groupedTasks = groupTasksByProject(report.tasks);
  if (groupedTasks.length === 0) {
    return '';
  }

  const lines: string[] = [];
  groupedTasks.forEach((group, groupIndex) => {
    lines.push(`${getSectionNumber(groupIndex)}、${group.projectName}`);
    group.tasks.forEach((task, taskIndex) => {
      lines.push(`  ${taskIndex + 1}. ${task.title}（${buildTaskSummary(task)}）`);
    });
  });
  return lines.join('\n');
}

/**
 * 按项目分组任务。
 *
 * 保持原有任务顺序，避免日报文本与页面展示顺序不一致。
 *
 * @param tasks 任务列表
 * @returns 按项目分组后的结果
 */
function groupTasksByProject(tasks: ProjectTaskReportTaskItem[]) {
  const groupMap = new Map<string, ProjectTaskReportTaskItem[]>();
  tasks.forEach((task) => {
    const projectName = resolveProjectName(task.projectName);
    const currentTasks = groupMap.get(projectName);
    if (currentTasks) {
      currentTasks.push(task);
      return;
    }
    groupMap.set(projectName, [task]);
  });

  return Array.from(groupMap.entries()).map(([projectName, groupTasks]) => {
    return {
      projectName,
      tasks: groupTasks,
    };
  });
}

/**
 * 生成任务摘要。
 *
 * @param task 任务项
 * @returns 状态与动态摘要
 */
function buildTaskSummary(task: ProjectTaskReportTaskItem) {
  const statusText = getTaskStatusText(task.status);
  if (shouldAppendLatestDynamic(task)) {
    return `${statusText}，${task.latestDynamicSummary}`;
  }
  return statusText;
}

/**
 * 判断是否需要追加最新动态。
 *
 * @param task 任务项
 * @returns 是否追加动态
 */
function shouldAppendLatestDynamic(task: ProjectTaskReportTaskItem) {
  if (!task.latestDynamicSummary) {
    return false;
  }
  return !isFinishedStatus(task.status);
}

/**
 * 判断任务是否已结束。
 *
 * @param status 状态编码
 * @returns 是否结束
 */
function isFinishedStatus(status: string) {
  if (status === 'done') {
    return true;
  }
  if (status === 'canceled') {
    return true;
  }
  return false;
}

/**
 * 获取任务状态文案。
 *
 * @param status 状态编码
 * @returns 中文状态
 */
function getTaskStatusText(status: string) {
  if (status === 'done') {
    return '完成';
  }
  if (status === 'canceled') {
    return '已取消';
  }
  if (status === 'inProgress') {
    return '进行中';
  }
  if (status === 'pendingTest') {
    return '待测试';
  }
  if (status === 'pendingRelease') {
    return '待发布';
  }
  return '待处理';
}

/**
 * 获取分组序号。
 *
 * @param index 索引
 * @returns 中文序号
 */
function getSectionNumber(index: number) {
  const cachedNumber = chineseSectionNumbers[index];
  if (cachedNumber) {
    return cachedNumber;
  }
  return String(index + 1);
}

/**
 * 解析项目名称。
 *
 * @param projectName 原始项目名称
 * @returns 项目名称
 */
function resolveProjectName(projectName?: string) {
  if (!projectName) {
    return '未归属项目';
  }
  return projectName;
}
