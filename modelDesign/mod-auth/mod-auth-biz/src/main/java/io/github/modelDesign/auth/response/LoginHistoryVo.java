package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 登录历史记录视图对象。
 */
@Data
@Builder
@Schema(description = "登录历史记录")
public class LoginHistoryVo {
    /**
     * 登录流水号。
     */
    @Schema(description = "登录流水号")
    private String loginId;

    /**
     * 登录 IP。
     */
    @Schema(description = "登录 IP")
    private String loginIp;

    /**
     * 登录方式。
     */
    @Schema(description = "登录方式")
    private String loginType;

    /**
     * 登录时间。
     */
    @Schema(description = "登录时间")
    private LocalDateTime loginTime;
}
