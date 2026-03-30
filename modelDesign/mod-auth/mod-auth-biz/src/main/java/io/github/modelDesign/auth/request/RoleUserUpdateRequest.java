package io.github.modelDesign.auth.request;

import lombok.Data;

import java.util.List;

/**
 * 角色绑定用户请求。
 */
@Data
public class RoleUserUpdateRequest {

    /**
     * 用户 ID 列表。
     */
    private List<Long> userIds;
}
