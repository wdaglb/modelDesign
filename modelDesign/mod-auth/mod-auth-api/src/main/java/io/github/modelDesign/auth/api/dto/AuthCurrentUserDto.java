package io.github.modelDesign.auth.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 当前登录用户 DTO。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthCurrentUserDto {
    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 用户昵称。
     */
    private String nickname;
}
