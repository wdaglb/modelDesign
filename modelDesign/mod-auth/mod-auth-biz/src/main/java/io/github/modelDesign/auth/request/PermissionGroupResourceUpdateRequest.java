package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 权限资源组资源更新请求。
 */
@Data
@Schema(description = "权限资源组资源更新请求")
public class PermissionGroupResourceUpdateRequest {
    /**
     * 菜单资源列表。
     */
    @Schema(description = "菜单资源列表")
    private List<String> menuResources;

    /**
     * 接口资源列表。
     */
    @Schema(description = "接口资源列表")
    private List<String> apiResources;
}
