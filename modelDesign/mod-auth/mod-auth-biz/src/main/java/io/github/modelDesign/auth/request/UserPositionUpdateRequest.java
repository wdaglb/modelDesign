package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 用户绑定职位请求。
 */
@Data
@Schema(description = "用户绑定职位请求")
public class UserPositionUpdateRequest {
    /**
     * 职位 ID 列表。
     */
    @Schema(description = "职位 ID 列表")
    private List<Long> positionIds;
}
