package io.github.modelDesign.auth.response;

import io.github.modelDesign.auth.enums.MenuNodeTypeEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 菜单管理响应。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuVo {
    /**
     * 菜单 ID。
     */
    private Long id;

    /**
     * 父级菜单 ID。
     */
    private Long parentId;

    /**
     * 菜单标识。
     */
    private String name;

    /**
     * 菜单显示名称。
     */
    private String title;

    /**
     * 菜单节点类型。
     */
    private MenuNodeTypeEnum nodeType;

    /**
     * 图标类型。
     */
    private String iconType;

    /**
     * 图标值。
     */
    private String iconValue;

    /**
     * 排序值。
     */
    private Integer sort;

    /**
     * 创建时间。
     */
    private String createdAt;

    /**
     * 更新时间。
     */
    private String updatedAt;
}
