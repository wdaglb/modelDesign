package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 权限资源组资源信息。
 */
@Data
@Builder
@Schema(description = "权限资源组资源信息")
public class PermissionGroupResourceVo {
    /**
     * 资源组编码。
     */
    @Schema(description = "资源组编码")
    private String groupCode;

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
