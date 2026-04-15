package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 权限资源目录项。
 */
@Data
@Builder
@Schema(description = "权限资源目录项")
public class PermissionResourceCatalogItemVo {
    /**
     * 资源路径。
     */
    @Schema(description = "资源路径")
    private String resource;

    /**
     * 资源标题。
     */
    @Schema(description = "资源标题")
    private String title;

    /**
     * 资源对应的 HTTP 方法集合。
     */
    @Schema(description = "资源对应的 HTTP 方法集合")
    private List<String> methods;
}
