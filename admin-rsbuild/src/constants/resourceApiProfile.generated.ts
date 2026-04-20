/**
 * 该文件由 scripts/generate-resource-api-profile.mjs 自动生成。
 * 请勿手动修改。
 */

export const GENERATED_MENU_RESOURCE_API_PROFILE = {
  "/agile-board": [
    "/project/list",
    "/project/task-status/list",
    "/project/task/agile-board",
    "/project/task/detail",
    "/project/task/detail/by-code",
    "/project/task/edit"
  ],
  "/login": [
    "/tenant/options"
  ],
  "/my-todo": [
    "/project/task-status/list",
    "/project/task/my-todo"
  ],
  "/personal-center": [
    "/ai/mcp/config/current",
    "/passport/change_password",
    "/passport/login_history",
    "/passport/mcp_token",
    "/passport/update_current_profile",
    "/third-party/qywork/binding/current",
    "/third-party/qywork/binding/session",
    "/third-party/qywork/config/current"
  ],
  "/project": [
    "/project/create",
    "/project/deleted",
    "/project/edit",
    "/project/list"
  ],
  "/project/$projectId": [
    "/project/create",
    "/project/detail",
    "/project/edit",
    "/project/list"
  ],
  "/project/$projectId/members": [
    "/project/member/add",
    "/project/member/delete",
    "/project/member/list"
  ],
  "/project/$projectId/tables": [
    "/scheme/submit"
  ],
  "/project/$projectId/tasks": [
    "/project/member/list",
    "/project/task/deleted",
    "/project/task/edit",
    "/project/task/list"
  ],
  "/project/task-type": [
    "/project/task-type/create",
    "/project/task-type/deleted",
    "/project/task-type/edit",
    "/project/task-type/list"
  ],
  "/system/file-config": [
    "/system/file/access-config/current",
    "/system/file/access-config/save"
  ],
  "/system/menu": [
    "/menu/create",
    "/menu/delete",
    "/menu/edit",
    "/menu/swap_sort"
  ],
  "/system/permission-group": [
    "/menu/list",
    "/permission-group/add",
    "/permission-group/delete",
    "/permission-group/list",
    "/permission-group/resources",
    "/permission-group/resources/update",
    "/permission-group/update",
    "/permission-group/update_status",
    "/permission-resource/catalog"
  ],
  "/system/position": [
    "/position/add",
    "/position/batch_update_status",
    "/position/delete",
    "/position/list",
    "/position/update",
    "/position/update_status"
  ],
  "/system/role": [
    "/menu/list",
    "/permission-group/list",
    "/permission-resource/catalog",
    "/role/add",
    "/role/batch_update_status",
    "/role/list",
    "/role/permission",
    "/role/permission/update",
    "/role/update",
    "/role/update_status",
    "/role/users",
    "/role/users/update",
    "/user/list"
  ],
  "/system/tenant": [
    "/tenant/add",
    "/tenant/delete",
    "/tenant/list",
    "/tenant/update",
    "/tenant/update_status"
  ],
  "/system/third-party/qywork": [
    "/third-party/qywork/config/current",
    "/third-party/qywork/config/save"
  ],
  "/system/user": [
    "/position/list",
    "/role/list",
    "/user/add",
    "/user/batch_update_status",
    "/user/list",
    "/user/positions",
    "/user/positions/update",
    "/user/roles",
    "/user/roles/update",
    "/user/update",
    "/user/update_status"
  ]
} as const;

export const GENERATED_BUTTON_RESOURCE_API_PROFILE = {} as const;
