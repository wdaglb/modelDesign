package io.github.modelDesign.auth.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户简要信息 DTO。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthUserSimpleDto {
    /**
     * 用户 ID。
     */
    private Long id;

    /**
     * 用户昵称。
     */
    private String nickname;

    /**
     * 头像文件 ID。
     */
    private String avatarId;

    /**
     * 是否禁用。
     *
     * `true` 表示禁用，`false` 表示启用。
     */
    private Boolean isDisable;
}
