package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.auth.enums.MenuNodeTypeEnum;
import io.github.modelDesign.auth.enums.MenuStatusEnum;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 后台菜单。
 */
@Data
@TableName("menu")
@EqualsAndHashCode(callSuper = true)
public class Menu extends BaseEntity {
    /**
     * 父级菜单 ID，0 表示顶级菜单。
     */
    private Long parentId;

    /**
     * 菜单唯一标识。
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
     * 前端路由路径。
     */
    private String path;

    /**
     * 同级排序值，越小越靠前。
     */
    private Integer sort;

    /**
     * 菜单状态。
     */
    private MenuStatusEnum status;
}
