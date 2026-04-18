import { PERMISSION_RESOURCE } from './permission.ts';
import {
  GENERATED_BUTTON_RESOURCE_API_PROFILE,
  GENERATED_MENU_RESOURCE_API_PROFILE,
} from './resourceApiProfile.generated.ts';

export interface PermissionGroupShortcut {
  /**
   * 快捷资源组编码。
   */
  code: string;

  /**
   * 快捷资源组名称。
   */
  name: string;

  /**
   * 触发该快捷资源组的页面或按钮资源。
   */
  triggerResources: string[];

  /**
   * 需要追加的接口资源。
   */
  apiResources: string[];

  /**
   * 快捷资源组说明。
   */
  description?: string;
}

/**
 * 手工维护的兜底资源组映射。
 *
 * 当构建期资源画像还未覆盖某些页面或按钮时，
 * 仍然允许回退到这份稳定常量，避免角色权限配置能力失效。
 */
export const PERMISSION_GROUP_SHORTCUTS: PermissionGroupShortcut[] = [
  {
    code: 'SYSTEM_ROLE_LIST',
    name: '角色列表查询',
    triggerResources: [PERMISSION_RESOURCE.systemRole],
    apiResources: ['/role/list'],
    description: '角色管理页面基础列表查询权限。',
  },
  {
    code: 'SYSTEM_ROLE_PAGE_DEPENDENCIES',
    name: '角色页面依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemRole],
    apiResources: ['/role/list'],
    description: '进入角色管理页面后会直接调用的接口。',
  },
  {
    code: 'SYSTEM_ROLE_CREATE_DEPENDENCIES',
    name: '角色新增依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemRoleCreate],
    apiResources: ['/role/add'],
    description: '角色新增弹窗实际调用的接口。',
  },
  {
    code: 'SYSTEM_ROLE_EDIT_DEPENDENCIES',
    name: '角色编辑依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemRoleEdit],
    apiResources: ['/role/update'],
    description: '角色编辑弹窗实际调用的接口。',
  },
  {
    code: 'SYSTEM_ROLE_PERMISSION_DEPENDENCIES',
    name: '角色权限配置依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemRolePermission],
    apiResources: [
      '/role/permission',
      '/role/permission/update',
      '/permission-group/list',
      '/menu/list',
      '/permission-resource/catalog',
    ],
    description: '角色权限配置抽屉实际调用的接口。',
  },
  {
    code: 'SYSTEM_ROLE_BIND_USER_DEPENDENCIES',
    name: '角色绑定用户依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemRoleBindUser],
    apiResources: ['/role/users', '/role/users/update', '/user/list'],
    description: '角色绑定用户抽屉实际调用的接口。',
  },
  {
    code: 'SYSTEM_ROLE_CHANGE_STATUS_DEPENDENCIES',
    name: '角色状态切换依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemRoleChangeStatus],
    apiResources: ['/role/update_status'],
    description: '角色单条状态切换实际调用的接口。',
  },
  {
    code: 'SYSTEM_ROLE_BATCH_CHANGE_STATUS_DEPENDENCIES',
    name: '角色批量状态切换依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemRoleBatchChangeStatus],
    apiResources: ['/role/batch_update_status'],
    description: '角色批量状态切换实际调用的接口。',
  },
  {
    code: 'SYSTEM_PERMISSION_GROUP_PAGE_DEPENDENCIES',
    name: '资源组页面依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemPermissionGroup],
    apiResources: ['/permission-group/list'],
    description: '权限资源组页面实际调用的接口。',
  },
  {
    code: 'SYSTEM_PERMISSION_GROUP_CREATE_DEPENDENCIES',
    name: '资源组新增依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemPermissionGroupCreate],
    apiResources: ['/permission-group/add'],
    description: '资源组新增弹窗实际调用的接口。',
  },
  {
    code: 'SYSTEM_PERMISSION_GROUP_EDIT_DEPENDENCIES',
    name: '资源组编辑依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemPermissionGroupEdit],
    apiResources: ['/permission-group/update'],
    description: '资源组编辑弹窗实际调用的接口。',
  },
  {
    code: 'SYSTEM_PERMISSION_GROUP_RESOURCE_DEPENDENCIES',
    name: '资源组配置资源依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemPermissionGroupResource],
    apiResources: [
      '/permission-group/resources',
      '/permission-group/resources/update',
      '/menu/list',
      '/permission-resource/catalog',
    ],
    description: '资源组配置资源抽屉实际调用的接口。',
  },
  {
    code: 'SYSTEM_PERMISSION_GROUP_CHANGE_STATUS_DEPENDENCIES',
    name: '资源组状态切换依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemPermissionGroupChangeStatus],
    apiResources: ['/permission-group/update_status'],
    description: '资源组单条状态切换实际调用的接口。',
  },
  {
    code: 'SYSTEM_PERMISSION_GROUP_DELETE_DEPENDENCIES',
    name: '资源组删除依赖接口',
    triggerResources: [PERMISSION_RESOURCE.systemPermissionGroupDelete],
    apiResources: ['/permission-group/delete'],
    description: '资源组删除按钮实际调用的接口。',
  },
  {
    code: 'PROJECT_PAGE_DEPENDENCIES',
    name: '项目管理页面依赖接口',
    triggerResources: [PERMISSION_RESOURCE.project],
    apiResources: ['/project/list', '/project/detail'],
    description: '进入项目管理页面后需要的基础项目接口。',
  },
  {
    code: 'AGILE_BOARD_PAGE_DEPENDENCIES',
    name: '敏捷面板页面依赖接口',
    triggerResources: [PERMISSION_RESOURCE.agileBoard],
    apiResources: [
      '/project/task/agile-board',
      '/project/task/dynamic/list',
      '/project/task/dynamic/create',
    ],
    description: '进入敏捷面板页面后需要的基础接口。',
  },
  {
    code: 'PROJECT_TASK_PAGE_DEPENDENCIES',
    name: '项目任务页面依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectTask],
    apiResources: [
      '/project/task/my-todo',
      '/project/task/list',
      '/project/task/board',
      '/project/task/agile-board',
      '/project/task/detail',
      '/project/task/children',
      '/project/task/children/batch',
      '/project/task/change-log/list',
      '/project/task/dynamic/list',
      '/project/task/dynamic/create',
    ],
    description: '进入项目任务页面、我的待办与敏捷面板后需要的基础任务接口。',
  },
  {
    code: 'PROJECT_CREATE_DEPENDENCIES',
    name: '项目新增依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectCreate],
    apiResources: ['/project/create'],
    description: '项目新增弹窗实际调用的接口。',
  },
  {
    code: 'PROJECT_EDIT_DEPENDENCIES',
    name: '项目编辑依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectEdit],
    apiResources: ['/project/edit'],
    description: '项目编辑弹窗实际调用的接口。',
  },
  {
    code: 'PROJECT_DELETE_DEPENDENCIES',
    name: '项目删除依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectDelete],
    apiResources: ['/project/deleted'],
    description: '项目删除按钮实际调用的接口。',
  },
  {
    code: 'PROJECT_MEMBER_DEPENDENCIES',
    name: '项目成员管理依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectMemberManage],
    apiResources: [
      '/project/member/list',
      '/project/member/add',
      '/project/member/delete',
    ],
    description: '项目成员管理实际调用的接口。',
  },
  {
    code: 'PROJECT_TASK_CREATE_DEPENDENCIES',
    name: '项目任务新增依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectTaskCreate],
    apiResources: ['/project/task/create'],
    description: '项目任务新增实际调用的接口。',
  },
  {
    code: 'PROJECT_TASK_EDIT_DEPENDENCIES',
    name: '项目任务编辑依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectTaskEdit],
    apiResources: ['/project/task/edit'],
    description: '项目任务编辑实际调用的接口。',
  },
  {
    code: 'PROJECT_TASK_DELETE_DEPENDENCIES',
    name: '项目任务删除依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectTaskDelete],
    apiResources: ['/project/task/deleted'],
    description: '项目任务删除实际调用的接口。',
  },
  {
    code: 'PROJECT_TASK_MEMBER_DEPENDENCIES',
    name: '项目任务成员管理依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectTaskMemberManage],
    apiResources: [
      '/project/task/member/list',
      '/project/task/member/add',
      '/project/task/member/delete',
    ],
    description: '项目任务成员管理实际调用的接口。',
  },
  {
    code: 'PROJECT_TASK_TAG_DEPENDENCIES',
    name: '项目任务标签管理依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectTaskTagManage],
    apiResources: [
      '/project/task/tag/list',
      '/project/task/tag/create',
      '/project/task/tag/edit',
      '/project/task/tag/deleted',
    ],
    description: '项目任务标签管理实际调用的接口。',
  },
  {
    code: 'PROJECT_TASK_STATUS_DEPENDENCIES',
    name: '项目任务状态配置依赖接口',
    triggerResources: [PERMISSION_RESOURCE.projectTaskStatusSave],
    apiResources: ['/project/task-status/list', '/project/task-status/save'],
    description: '项目任务状态配置实际调用的接口。',
  },
];

/**
 * 构建期生成的菜单资源画像。
 */
export const GENERATED_MENU_API_PROFILE: Record<string, string[]> = {
  ...GENERATED_MENU_RESOURCE_API_PROFILE,
};

/**
 * 构建期生成的按钮资源画像。
 */
export const GENERATED_BUTTON_API_PROFILE: Record<string, string[]> = {
  ...GENERATED_BUTTON_RESOURCE_API_PROFILE,
};

/**
 * 读取手工兜底映射。
 */
function buildFallbackResourceApiMap() {
  const resourceToApiSetMap = new Map<string, Set<string>>();

  for (const shortcut of PERMISSION_GROUP_SHORTCUTS) {
    for (const triggerResource of shortcut.triggerResources) {
      const currentApiSet =
        resourceToApiSetMap.get(triggerResource) ?? new Set<string>();
      shortcut.apiResources.forEach((resource) => {
        currentApiSet.add(resource);
      });
      resourceToApiSetMap.set(triggerResource, currentApiSet);
    }
  }

  return resourceToApiSetMap;
}

/**
 * 合并生成画像与手工兜底映射。
 *
 * 优先使用构建期扫描出的真实结果，同时保留现有常量作为补齐来源。
 */
export function buildResourceApiProfileMap() {
  const profileMap = buildFallbackResourceApiMap();
  const generatedProfiles = [
    GENERATED_MENU_API_PROFILE,
    GENERATED_BUTTON_API_PROFILE,
  ];

  generatedProfiles.forEach((profile) => {
    Object.entries(profile).forEach(([resource, apiResources]) => {
      const currentApiSet = profileMap.get(resource) ?? new Set<string>();
      apiResources.forEach((apiResource) => {
        currentApiSet.add(apiResource);
      });
      profileMap.set(resource, currentApiSet);
    });
  });

  return profileMap;
}

/**
 * 根据当前勾选的页面或按钮资源，找出命中的快捷资源组。
 */
export function matchPermissionGroupShortcuts(selectedResources: string[]) {
  const selectedResourceSet = new Set(selectedResources);
  return PERMISSION_GROUP_SHORTCUTS.filter((item) => {
    return item.triggerResources.some((resource) => {
      return selectedResourceSet.has(resource);
    });
  });
}

/**
 * 汇总快捷资源组里的接口资源并去重。
 */
export function collectShortcutApiResources(
  shortcuts: PermissionGroupShortcut[],
) {
  return Array.from(
    new Set(
      shortcuts.flatMap((item) => {
        return item.apiResources;
      }),
    ),
  );
}

/**
 * 统计每个菜单或按钮资源会自动补齐多少接口资源。
 */
export function buildShortcutApiUsageCountMap() {
  return Object.fromEntries(
    Array.from(buildResourceApiProfileMap().entries()).map(
      ([resource, apiSet]) => {
        return [resource, apiSet.size];
      },
    ),
  );
}

/**
 * 根据当前勾选的菜单或按钮资源，自动聚合要提交的接口资源。
 */
export function collectAutoApiResourcesByMenuResources(
  selectedResources: string[],
) {
  const profileMap = buildResourceApiProfileMap();
  const resourceSet = new Set<string>();

  selectedResources.forEach((resource) => {
    const apiResources = profileMap.get(resource);
    if (!apiResources) {
      return;
    }
    apiResources.forEach((apiResource) => {
      resourceSet.add(apiResource);
    });
  });

  return Array.from(resourceSet);
}
