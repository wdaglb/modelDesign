package io.github.modelDesign.auth.request;

import lombok.Data;

import java.util.List;

/**
 * 用户绑定角色请求。
 */
@Data
public class UserRoleUpdateRequest {

    /**
     * 角色编码列表。
     */
    private List<String> roleCodes;
}
