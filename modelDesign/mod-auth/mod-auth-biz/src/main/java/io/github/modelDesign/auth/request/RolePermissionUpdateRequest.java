package io.github.modelDesign.auth.request;

import lombok.Data;

import java.util.List;

/**
 * 角色权限更新请求。
 */
@Data
public class RolePermissionUpdateRequest {

    /**
     * 菜单权限路径列表（type=menu），每项为菜单 path，例如：/system/role。
     */
    private List<String> menus;
}
