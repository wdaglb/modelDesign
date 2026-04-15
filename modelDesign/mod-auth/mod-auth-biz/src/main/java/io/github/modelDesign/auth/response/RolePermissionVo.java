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
     * 直接绑定的菜单资源列表。
     */
    @Schema(description = "直接绑定的菜单资源列表")
    private List<String> menuResources;

    /**
     * 直接绑定的接口资源列表。
     */
    @Schema(description = "直接绑定的接口资源列表")
    private List<String> apiResources;

    /**
     * 直接绑定的资源组编码列表。
     */
    @Schema(description = "直接绑定的资源组编码列表")
    private List<String> resourceGroupCodes;
}
