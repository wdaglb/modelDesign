package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 角色权限更新请求。
 */
@Data
@Schema(description = "角色权限更新请求")
public class RolePermissionUpdateRequest {

    /**
     * 菜单权限路径列表（type=menu），每项为菜单 path，例如：/system/role。
     */
    @Schema(description = "菜单权限路径列表")
    private List<String> menus;
}
