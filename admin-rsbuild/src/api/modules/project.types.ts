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

/**
 * 创建项目参数
 */
export interface CreateProjectParams {
  code: string;
  name: string;
  description?: string;
  dbType: DatabaseType;
}

/**
 * 编辑项目参数
 */
export interface EditProjectParams {
  name?: string;
  description?: string;
  dbType?: DatabaseType;
}
