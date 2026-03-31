package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 角色绑定用户请求。
 */
@Data
@Schema(description = "角色绑定用户请求")
public class RoleUserUpdateRequest {

    /**
     * 用户 ID 列表。
     */
    @Schema(description = "用户 ID 列表")
    private List<Long> userIds;
}
