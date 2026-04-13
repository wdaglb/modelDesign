/**
 * 前端权限资源常量。
 *
 * 这些标识与后端菜单树、Casbin 资源和接口鉴权保持一致，
 * 目的是避免各页面散落硬编码路径，导致按钮显隐和后端权限脱节。
 */
export const PERMISSION_RESOURCE = {
  systemMenu: '/system/menu',
  systemRole: '/system/role',
  systemUser: '/system/user',
  systemPosition: '/system/position',
  systemTenant: '/system/tenant',
  systemFileConfig: '/system/file-config',
  systemPermissionGroup: '/system/permission-group',
  systemQywork: '/system/third-party/qywork',
  project: '/project',
  agileBoard: '/agile-board',
  aiChat: '/ai/chat',
  projectTask: '/project/task',
  systemMenuCreate: '/system/menu/create',
  systemMenuEdit: '/system/menu/edit',
  systemMenuDelete: '/system/menu/delete',
  systemMenuSort: '/system/menu/sort',
  systemRoleCreate: '/system/role/create',
  systemRoleEdit: '/system/role/edit',
  systemRolePermission: '/system/role/permission',
  systemRoleBindUser: '/system/role/bind-user',
  systemRoleChangeStatus: '/system/role/change-status',
  systemRoleBatchChangeStatus: '/system/role/batch-change-status',
  systemUserCreate: '/system/user/create',
  systemUserEdit: '/system/user/edit',
  systemUserBindRole: '/system/user/bind-role',
  systemUserBindPosition: '/system/user/bind-position',
  systemUserChangeStatus: '/system/user/change-status',
  systemUserBatchChangeStatus: '/system/user/batch-change-status',
  systemPositionCreate: '/system/position/create',
  systemPositionEdit: '/system/position/edit',
  systemPositionDelete: '/system/position/delete',
  systemPositionChangeStatus: '/system/position/change-status',
  systemPositionBatchChangeStatus: '/system/position/batch-change-status',
  systemTenantCreate: '/system/tenant/create',
  systemTenantEdit: '/system/tenant/edit',
  systemTenantDelete: '/system/tenant/delete',
  systemTenantChangeStatus: '/system/tenant/change-status',
  systemFileConfigSave: '/system/file/access-config/save',
  systemPermissionGroupCreate: '/permission-group/add',
  systemPermissionGroupEdit: '/permission-group/update',
  systemPermissionGroupChangeStatus: '/permission-group/update_status',
  systemPermissionGroupResource: '/permission-group/resources/update',
  systemQyworkSave: '/system/third-party/qywork/save',
  projectCreate: '/project/create',
  projectEdit: '/project/edit',
  projectDelete: '/project/deleted',
  projectMemberManage: '/project/member/*',
  projectTaskCreate: '/project/task/create',
  projectTaskEdit: '/project/task/edit',
  projectTaskDelete: '/project/task/deleted',
  projectTaskMemberManage: '/project/task/member/*',
  projectTaskStatusSave: '/project/task-status/save',
  projectTaskTagManage: '/project/task/tag/*',
} as const;

/**
 * 平台级权限资源前缀。
 *
 * 这些功能会直接影响全局菜单树或全部租户，
 * 仅允许默认租户管理员看到和分配。
 */
export const PLATFORM_ONLY_PERMISSION_PREFIXES = [
  PERMISSION_RESOURCE.systemMenu,
  PERMISSION_RESOURCE.systemTenant,
  PERMISSION_RESOURCE.systemPermissionGroup,
];
