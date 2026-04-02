/**
 * 项目
 */
export interface Project {
  id: number;
  /**
   * 项目编号
   */
  code: string;
  /**
   * 名称
   */
  name: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 项目状态
   */
  status: ProjectStatus;
  /**
   * 项目分组
   */
  projectGroup?: string;
  /**
   * 当前进展
   */
  progressSummary?: string;
  /**
   * 已完成模块数
   */
  completedModuleCount?: number;
  /**
   * 创建人
   */
  creator: string;
  /**
   * 创建时间
   */
  createdAt: string;
  /**
   * 数据库类型
   */
  dbType: DatabaseType;
  updatedAt?: string;
  [property: string]: any;
}

/**
 * 分页响应
 */
export interface PageResponse<T> {
  items: T[];
  total: number;
}

/**
 * 项目状态统计
 */
export interface ProjectStatusSummary {
  all: number;
  planning: number;
  inProgress: number;
  atRisk: number;
  archived: number;
}

/**
 * 项目列表响应
 */
export interface ProjectListResponse {
  items: Project[];
  total: number;
  statusSummary: ProjectStatusSummary;
  groupOptions: string[];
}

/**
 * 项目列表查询参数
 */
export interface ProjectListParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  status?: ProjectStatus;
  projectGroup?: string;
}

/**
 * 数据库类型
 */
export enum DatabaseType {
  /**
   * MySQL
   */
  MySQL = 'mysql',
  /**
   * PostgreSQL
   */
  PostgreSQL = 'postgresql',
  /**
   * SQLite
   */
  SQLite = 'sqlite',
  /**
   * MongoDB
   */
  MongoDB = 'mongodb',
}

/**
 * 项目状态
 */
export enum ProjectStatus {
  /**
   * 规划中
   */
  Planning = 'planning',
  /**
   * 进行中
   */
  InProgress = 'inProgress',
  /**
   * 风险中
   */
  AtRisk = 'atRisk',
  /**
   * 已归档
   */
  Archived = 'archived',
}

export const DatabaseTypeLabel = {
  [DatabaseType.MySQL]: 'MySQL',
  [DatabaseType.PostgreSQL]: 'PostgreSQL',
  [DatabaseType.SQLite]: 'SQLite',
  [DatabaseType.MongoDB]: 'MongoDB',
};

export const DatabaseTypeOptions = [
  DatabaseType.MySQL,
  DatabaseType.PostgreSQL,
  DatabaseType.SQLite,
  DatabaseType.MongoDB,
].map((item) => ({
  label: DatabaseTypeLabel[item],
  value: item,
}));

export const ProjectStatusLabel = {
  [ProjectStatus.Planning]: '规划中',
  [ProjectStatus.InProgress]: '进行中',
  [ProjectStatus.AtRisk]: '风险中',
  [ProjectStatus.Archived]: '已归档',
};

export const ProjectStatusColor = {
  [ProjectStatus.Planning]: 'orange',
  [ProjectStatus.InProgress]: 'green',
  [ProjectStatus.AtRisk]: 'red',
  [ProjectStatus.Archived]: 'default',
};

export const ProjectStatusOptions = [
  ProjectStatus.Planning,
  ProjectStatus.InProgress,
  ProjectStatus.AtRisk,
  ProjectStatus.Archived,
].map((item) => ({
  label: ProjectStatusLabel[item],
  value: item,
}));

/**
 * 创建项目参数
 */
export interface CreateProjectParams {
  code: string;
  name: string;
  description?: string;
  dbType: DatabaseType;
  status?: ProjectStatus;
  projectGroup?: string;
  progressSummary?: string;
  completedModuleCount?: number;
}

/**
 * 编辑项目参数
 */
export interface EditProjectParams {
  name?: string;
  description?: string;
  dbType?: DatabaseType;
  status?: ProjectStatus;
  projectGroup?: string;
  progressSummary?: string;
  completedModuleCount?: number;
}
