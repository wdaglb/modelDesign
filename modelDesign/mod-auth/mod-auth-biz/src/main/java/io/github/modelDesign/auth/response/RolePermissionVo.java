package io.github.modelDesign.auth.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 角色权限信息。
 */
@Data
@Builder
public class RolePermissionVo {

    /**
     * 菜单权限路径列表（type=menu），每项为菜单 path，例如：/system/role。
     */
    private List<String> menus;
}
