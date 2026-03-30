package io.github.modelDesign.auth.response;

import lombok.Builder;
import lombok.Data;

/**
 * 角色列表项。
 */
@Data
@Builder
public class RoleListItemVo {
    /**
     * 角色 ID。
     */
    private Long id;

    /**
     * 角色名称。
     */
    private String name;

    /**
     * 角色编码。
     */
    private String code;

    /**
     * 角色备注。
     */
    private String remark;

    /**
     * 排序值。
     */
    private Integer sort;

    /**
     * 是否禁用。
     */
    private Boolean isDisable;
}
