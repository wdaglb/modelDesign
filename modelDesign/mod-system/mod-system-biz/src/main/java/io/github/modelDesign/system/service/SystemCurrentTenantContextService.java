package io.github.modelDesign.system.service;

import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * 系统模块租户上下文服务。
 */
@Service
public class SystemCurrentTenantContextService {
    /**
     * 获取当前登录租户 ID。
     *
     * @return 当前登录租户 ID
     */
    public Long requireCurrentTenantId() {
        CurrentAdmin currentAdmin = AuthContext.get();
        if (currentAdmin == null) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED.value(),
                    "未登录或登录已失效"
            );
        }
        if (currentAdmin.getTenantId() == null) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    "当前登录用户未绑定租户"
            );
        }
        return currentAdmin.getTenantId();
    }
}
