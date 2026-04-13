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
     * 资源路径列表。
     */
    @Schema(description = "资源路径列表")
    private List<String> resources;
}
