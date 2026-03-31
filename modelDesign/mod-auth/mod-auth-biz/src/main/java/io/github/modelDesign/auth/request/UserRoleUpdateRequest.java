package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 用户绑定角色请求。
 */
@Data
@Schema(description = "用户绑定角色请求")
public class UserRoleUpdateRequest {

    /**
     * 角色编码列表。
     */
    @Schema(description = "角色编码列表")
    private List<String> roleCodes;
}
