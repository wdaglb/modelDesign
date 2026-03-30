import {
  TodoItem,
  TodoListParams,
  TodoPageResponse,
  TodoPriority,
  TodoStatus,
} from './todo.types';

/**
 * 我的待办静态数据。
 *
 * 当前仓库尚未落地真实待办接口，因此先使用前端占位数据完成页面搭建。
 * 后续后端接口准备完成后，只需要将 `getList` 切换为真实请求即可。
 */
const todoList: TodoItem[] = [
  {
    id: 10001,
    title: '审核项目“智能报表平台”数据字典变更申请',
    receivedAt: '2026-03-30 09:10:00',
    priority: TodoPriority.High,
    status: TodoStatus.Pending,
    initiatorName: '张三',
    projectId: 1,
    projectName: '智能报表平台',
  },
  {
    id: 10002,
    title: '确认用户管理模块权限调整方案',
    receivedAt: '2026-03-30 10:25:00',
    priority: TodoPriority.Medium,
    status: TodoStatus.Processing,
    initiatorName: '李四',
    projectId: 2,
    projectName: '统一权限中心',
  },
  {
    id: 10003,
    title: '补充项目成员变更记录说明文档',
    receivedAt: '2026-03-29 15:42:00',
    priority: TodoPriority.Low,
    status: TodoStatus.Completed,
    initiatorName: '王五',
    projectId: 3,
    projectName: '模型设计平台',
  },
  {
    id: 10004,
    title: '处理菜单管理页面排序异常反馈',
    receivedAt: '2026-03-29 16:20:00',
    priority: TodoPriority.High,
    status: TodoStatus.Processing,
    initiatorName: '赵六',
    projectId: 2,
    projectName: '统一权限中心',
  },
  {
    id: 10005,
    title: '跟进 AI 聊天页面提示词配置项评审',
    receivedAt: '2026-03-28 13:30:00',
    priority: TodoPriority.Medium,
    status: TodoStatus.Pending,
    initiatorName: '钱七',
    projectId: 4,
    projectName: 'AI 协作助手',
  },
  {
    id: 10006,
    title: '整理项目初始化脚本发布清单',
    receivedAt: '2026-03-28 09:18:00',
    priority: TodoPriority.Low,
    status: TodoStatus.Pending,
    initiatorName: '孙八',
    projectId: 5,
    projectName: '平台基础设施',
  },
  {
    id: 10007,
    title: '复核角色绑定用户批量操作交互说明',
    receivedAt: '2026-03-27 18:05:00',
    priority: TodoPriority.Medium,
    status: TodoStatus.Completed,
    initiatorName: '周九',
    projectId: 2,
    projectName: '统一权限中心',
  },
  {
    id: 10008,
    title: '确认项目数据表设计页面字段命名规范',
    receivedAt: '2026-03-27 11:12:00',
    priority: TodoPriority.High,
    status: TodoStatus.Pending,
    initiatorName: '吴十',
    projectId: 3,
    projectName: '模型设计平台',
  },
];

/**
 * 获取我的待办列表。
 *
 * 说明：
 * - 当前阶段返回静态占位数据
 * - 保持返回结构为 `{ items, total }`，与现有分页接口约定一致
 */
export const getList = async (params?: TodoListParams): Promise<TodoPageResponse> => {
  const current = params?.current || 1;
  const pageSize = params?.pageSize || 10;

  const filteredList = todoList.filter((item) => {
    if (params?.title) {
      const keyword = params.title.trim();
      if (keyword && !item.title.includes(keyword)) {
        return false;
      }
    }

    if (params?.priority && item.priority !== params.priority) {
      return false;
    }

    if (params?.status && item.status !== params.status) {
      return false;
    }

    return true;
  });

  const start = (current - 1) * pageSize;
  const end = start + pageSize;

  return Promise.resolve({
    items: filteredList.slice(start, end),
    total: filteredList.length,
  });
};
