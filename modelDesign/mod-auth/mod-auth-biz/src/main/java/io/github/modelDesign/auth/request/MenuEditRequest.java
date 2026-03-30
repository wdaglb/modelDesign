package io.github.modelDesign.auth.request;

import io.github.modelDesign.auth.enums.MenuNodeTypeEnum;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 编辑菜单请求。
 */
@Data
public class MenuEditRequest {
    /**
     * 父级菜单 ID。
     */
    @NotNull(message = "父级菜单不能为空")
    @Min(value = 0, message = "父级菜单不合法")
    private Long parentId;

    /**
     * 菜单标识。
     */
    @NotBlank(message = "菜单标识不能为空")
    @Size(max = 200, message = "菜单标识长度不能超过 200 个字符")
    private String name;

    /**
     * 菜单显示名称。
     */
    @NotBlank(message = "显示名称不能为空")
    @Size(max = 100, message = "显示名称长度不能超过 100 个字符")
    private String title;

    /**
     * 菜单节点类型。
     */
    @NotNull(message = "节点类型不能为空")
    private MenuNodeTypeEnum nodeType;

    /**
     * 图标类型。
     */
    @Size(max = 32, message = "图标类型长度不能超过 32 个字符")
    private String iconType;

    /**
     * 图标值。
     */
    @Size(max = 100, message = "图标值长度不能超过 100 个字符")
    private String iconValue;

    /**
     * 排序值。
     */
    @NotNull(message = "排序不能为空")
    @Min(value = 0, message = "排序不能小于 0")
    private Integer sort;
}
