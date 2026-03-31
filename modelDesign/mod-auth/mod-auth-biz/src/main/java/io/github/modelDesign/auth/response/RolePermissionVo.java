package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 角色权限信息。
 */
@Data
@Builder
@Schema(description = "角色权限信息")
public class RolePermissionVo {

    /**
     * 菜单权限路径列表（type=menu），每项为菜单 path，例如：/system/role。
     */
    @Schema(description = "菜单权限路径列表")
    private List<String> menus;
}
