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
     * 直接绑定的资源路径列表。
     */
    @Schema(description = "直接绑定的资源路径列表")
    private List<String> resources;

    /**
     * 绑定的资源组编码列表。
     */
    @Schema(description = "绑定的资源组编码列表")
    private List<String> resourceGroupCodes;
}
