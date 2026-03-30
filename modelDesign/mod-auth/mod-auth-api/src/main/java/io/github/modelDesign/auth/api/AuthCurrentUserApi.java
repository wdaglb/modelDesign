package io.github.modelDesign.auth.api;

import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;

/**
 * 当前登录用户接口。
 */
public interface AuthCurrentUserApi {
    /**
     * 获取当前登录用户。
     *
     * @return 当前登录用户
     */
    AuthCurrentUserDto getCurrentUser();
}
