package io.github.modelDesign.auth.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.List;

/**
 * 角色列表请求。
 */
@Data
public class RoleListRequest {
    /**
     * 页码。
     */
    @Min(value = 1, message = "页码不能小于 1")
    private Long current = 1L;

    /**
     * 每页条数。
     */
    @Min(value = 1, message = "每页条数不能小于 1")
    private Long pageSize = 10L;

    /**
     * 角色 ID 列表。
     */
    private List<Long> ids;

    /**
     * 角色名称关键字。
     */
    private String name;

    /**
     * 角色编码关键字。
     */
    private String code;
}
