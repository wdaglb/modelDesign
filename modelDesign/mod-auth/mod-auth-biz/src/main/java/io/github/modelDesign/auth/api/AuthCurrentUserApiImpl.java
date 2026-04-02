package io.github.modelDesign.auth.api;

import io.github.modelDesign.auth.api.dto.AuthCurrentUserDto;
import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * 当前登录用户接口实现。
 */
@Service
public class AuthCurrentUserApiImpl implements AuthCurrentUserApi {
    /**
     * 获取当前登录用户。
     *
     * @return 当前登录用户
     */
    @Override
    public AuthCurrentUserDto getCurrentUser() {
        CurrentAdmin currentAdmin = AuthContext.get();
        if (currentAdmin == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "未登录或登录已失效");
        }
        return AuthCurrentUserDto.builder()
                .userId(currentAdmin.getUserId())
                .tenantId(currentAdmin.getTenantId())
                .nickname(currentAdmin.getNickname())
                .build();
    }
}
