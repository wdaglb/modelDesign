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
     * 绑定的资源组编码列表。
     */
    @Schema(description = "绑定的资源组编码列表")
    private List<String> resourceGroupCodes;
}
