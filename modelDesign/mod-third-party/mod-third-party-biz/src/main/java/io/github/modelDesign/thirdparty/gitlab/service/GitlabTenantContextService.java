package io.github.modelDesign.thirdparty.gitlab.service;

import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * GitLab 租户上下文服务。
 */
@Service
public class GitlabTenantContextService {
    /**
     * 获取当前登录租户 ID。
     *
     * @return 当前登录租户 ID
     */
    public Long requireCurrentTenantId() {
        CurrentAdmin currentAdmin = AuthContext.get();
        if (currentAdmin == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "未登录");
        }
        if (currentAdmin.getTenantId() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "当前登录用户未绑定租户");
        }
        return currentAdmin.getTenantId();
    }
}
