package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 当前登录用户权限信息。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "当前登录用户权限信息")
public class CurrentPermissionVo {
    /**
     * 当前用户可见菜单列表。
     */
    @Schema(description = "当前用户可见菜单列表")
    private List<MenuItemVo> menus;

    /**
     * 菜单项。
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "菜单项")
    public static class MenuItemVo {
        /**
         * 菜单 ID。
         */
        @Schema(description = "菜单 ID")
        private Long id;

        /**
         * 父级菜单 ID。
         */
        @Schema(description = "父级菜单 ID")
        private Long parentId;

        /**
         * 菜单唯一标识。
         */
        @Schema(description = "菜单唯一标识")
        private String name;

        /**
         * 菜单标题。
         */
        @Schema(description = "菜单标题")
        private String title;

        /**
         * 图标类型。
         */
        @Schema(description = "图标类型")
        private String iconType;

        /**
         * 图标值。
         */
        @Schema(description = "图标值")
        private String iconValue;
    }
}
