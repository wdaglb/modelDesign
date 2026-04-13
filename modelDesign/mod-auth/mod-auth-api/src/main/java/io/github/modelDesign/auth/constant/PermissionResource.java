package io.github.modelDesign.auth.constant;

import java.util.Set;

/**
 * 系统权限资源常量。
 *
 * 当前项目继续沿用菜单树作为“页面 + 按钮”统一资源树，
 * 因此这里的字符串既可能代表页面菜单，也可能代表页面按钮。
 */
public final class PermissionResource {
    /**
     * 平台默认租户 ID。
     */
    public static final long PLATFORM_TENANT_ID = 1L;

    /**
     * 菜单管理页面。
     */
    public static final String SYSTEM_MENU = "/system/menu";

    /**
     * 角色管理页面。
     */
    public static final String SYSTEM_ROLE = "/system/role";

    /**
     * 用户管理页面。
     */
    public static final String SYSTEM_USER = "/system/user";

    /**
     * 职位管理页面。
     */
    public static final String SYSTEM_POSITION = "/system/position";

    /**
     * 租户管理页面。
     */
    public static final String SYSTEM_TENANT = "/system/tenant";

    /**
     * 企业微信配置页面。
     */
    public static final String SYSTEM_QYWORK = "/system/third-party/qywork";

    /**
     * 文件访问配置页面。
     */
    public static final String SYSTEM_FILE_CONFIG = "/system/file-config";

    /**
     * 权限资源组页面。
     */
    public static final String SYSTEM_PERMISSION_GROUP = "/system/permission-group";

    /**
     * 项目管理页面。
     */
    public static final String PROJECT = "/project";

    /**
     * 敏捷看板页面。
     */
    public static final String AGILE_BOARD = "/agile-board";

    /**
     * AI 对话页面。
     */
    public static final String AI_CHAT = "/ai/chat";

    /**
     * 项目任务页面。
     */
    public static final String PROJECT_TASK = "/project/task";

    /**
     * 菜单新增。
     */
    public static final String SYSTEM_MENU_CREATE = "/system/menu/create";

    /**
     * 菜单编辑。
     */
    public static final String SYSTEM_MENU_EDIT = "/system/menu/edit";

    /**
     * 菜单删除。
     */
    public static final String SYSTEM_MENU_DELETE = "/system/menu/delete";

    /**
     * 菜单排序。
     */
    public static final String SYSTEM_MENU_SORT = "/system/menu/sort";

    /**
     * 角色新增。
     */
    public static final String SYSTEM_ROLE_CREATE = "/system/role/create";

    /**
     * 角色编辑。
     */
    public static final String SYSTEM_ROLE_EDIT = "/system/role/edit";

    /**
     * 角色权限配置。
     */
    public static final String SYSTEM_ROLE_PERMISSION = "/system/role/permission";

    /**
     * 角色绑定用户。
     */
    public static final String SYSTEM_ROLE_BIND_USER = "/system/role/bind-user";

    /**
     * 角色单条状态切换。
     */
    public static final String SYSTEM_ROLE_CHANGE_STATUS = "/system/role/change-status";

    /**
     * 角色批量状态切换。
     */
    public static final String SYSTEM_ROLE_BATCH_CHANGE_STATUS = "/system/role/batch-change-status";

    /**
     * 用户新增。
     */
    public static final String SYSTEM_USER_CREATE = "/system/user/create";

    /**
     * 用户编辑。
     */
    public static final String SYSTEM_USER_EDIT = "/system/user/edit";

    /**
     * 用户绑定角色。
     */
    public static final String SYSTEM_USER_BIND_ROLE = "/system/user/bind-role";

    /**
     * 用户绑定职位。
     */
    public static final String SYSTEM_USER_BIND_POSITION = "/system/user/bind-position";

    /**
     * 用户单条状态切换。
     */
    public static final String SYSTEM_USER_CHANGE_STATUS = "/system/user/change-status";

    /**
     * 用户批量状态切换。
     */
    public static final String SYSTEM_USER_BATCH_CHANGE_STATUS = "/system/user/batch-change-status";

    /**
     * 职位新增。
     */
    public static final String SYSTEM_POSITION_CREATE = "/system/position/create";

    /**
     * 职位编辑。
     */
    public static final String SYSTEM_POSITION_EDIT = "/system/position/edit";

    /**
     * 职位删除。
     */
    public static final String SYSTEM_POSITION_DELETE = "/system/position/delete";

    /**
     * 职位单条状态切换。
     */
    public static final String SYSTEM_POSITION_CHANGE_STATUS = "/system/position/change-status";

    /**
     * 职位批量状态切换。
     */
    public static final String SYSTEM_POSITION_BATCH_CHANGE_STATUS = "/system/position/batch-change-status";

    /**
     * 租户新增。
     */
    public static final String SYSTEM_TENANT_CREATE = "/system/tenant/create";

    /**
     * 租户编辑。
     */
    public static final String SYSTEM_TENANT_EDIT = "/system/tenant/edit";

    /**
     * 租户删除。
     */
    public static final String SYSTEM_TENANT_DELETE = "/system/tenant/delete";

    /**
     * 租户状态切换。
     */
    public static final String SYSTEM_TENANT_CHANGE_STATUS = "/system/tenant/change-status";

    /**
     * 企业微信配置保存。
     */
    public static final String SYSTEM_QYWORK_SAVE = "/system/third-party/qywork/save";

    /**
     * 文件访问配置保存。
     */
    public static final String SYSTEM_FILE_ACCESS_CONFIG_SAVE = "/system/file/access-config/save";

    /**
     * 权限资源组新增。
     */
    public static final String SYSTEM_PERMISSION_GROUP_CREATE = "/permission-group/add";

    /**
     * 权限资源组编辑。
     */
    public static final String SYSTEM_PERMISSION_GROUP_EDIT = "/permission-group/update";

    /**
     * 权限资源组状态切换。
     */
    public static final String SYSTEM_PERMISSION_GROUP_CHANGE_STATUS = "/permission-group/update_status";

    /**
     * 权限资源组资源配置。
     */
    public static final String SYSTEM_PERMISSION_GROUP_RESOURCE = "/permission-group/resources/update";

    /**
     * 项目新增。
     */
    public static final String PROJECT_CREATE = "/project/create";

    /**
     * 项目编辑。
     */
    public static final String PROJECT_EDIT = "/project/edit";

    /**
     * 项目删除。
     */
    public static final String PROJECT_DELETE = "/project/deleted";

    /**
     * 项目成员管理。
     */
    public static final String PROJECT_MEMBER_MANAGE = "/project/member/*";

    /**
     * 项目任务创建。
     */
    public static final String PROJECT_TASK_CREATE = "/project/task/create";

    /**
     * 项目任务编辑。
     */
    public static final String PROJECT_TASK_EDIT = "/project/task/edit";

    /**
     * 项目任务删除。
     */
    public static final String PROJECT_TASK_DELETE = "/project/task/deleted";

    /**
     * 项目任务成员管理。
     */
    public static final String PROJECT_TASK_MEMBER_MANAGE = "/project/task/member/*";

    /**
     * 任务状态配置保存。
     */
    public static final String PROJECT_TASK_STATUS_SAVE = "/project/task-status/save";

    /**
     * 任务标签管理。
     */
    public static final String PROJECT_TASK_TAG_MANAGE = "/project/task/tag/*";

    /**
     * AI 对话消息接口。
     */
    public static final String AI_CHAT_MESSAGE = "/ai/chat/messages";

    /**
     * 平台级资源前缀。
     *
     * 这些资源会直接影响所有租户的全局治理能力，
     * 因此不允许普通租户管理员通过租户内角色进行授权。
     */
    private static final Set<String> PLATFORM_ONLY_PREFIXES = Set.of(
            SYSTEM_MENU,
            SYSTEM_TENANT,
            SYSTEM_PERMISSION_GROUP
    );

    private PermissionResource() {
    }

    /**
     * 判断某个资源是否属于平台级资源。
     *
     * @param resource 资源标识
     * @return 是否属于平台级资源
     */
    public static boolean isPlatformOnlyResource(String resource) {
        if (resource == null || resource.isBlank()) {
            return false;
        }
        for (String prefix : PLATFORM_ONLY_PREFIXES) {
            if (resource.equals(prefix)) {
                return true;
            }
            if (resource.startsWith(prefix + "/")) {
                return true;
            }
        }
        return false;
    }

    /**
     * 判断某个资源在当前租户下是否允许分配。
     *
     * @param tenantId 当前租户 ID
     * @param resource 资源标识
     * @return 是否允许分配
     */
    public static boolean isResourceAssignable(Long tenantId, String resource) {
        if (!isPlatformOnlyResource(resource)) {
            return true;
        }
        if (tenantId == null) {
            return false;
        }
        return PLATFORM_TENANT_ID == tenantId;
    }
}
