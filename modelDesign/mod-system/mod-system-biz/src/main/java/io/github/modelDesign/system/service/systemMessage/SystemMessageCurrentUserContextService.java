package io.github.modelDesign.system.service.systemMessage;

import io.github.modelDesign.auth.session.AuthContext;
import io.github.modelDesign.auth.session.CurrentAdmin;
import io.github.modelDesign.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * 系统消息当前用户上下文服务。
 */
@Service
public class SystemMessageCurrentUserContextService {
    /**
     * 获取当前登录用户 ID。
     *
     * @return 当前登录用户 ID
     */
    public Long requireCurrentUserId() {
        return requireCurrentAdmin().getUserId();
    }

    /**
     * 获取当前登录租户 ID。
     *
     * @return 当前登录租户 ID，可为空
     */
    public Long getCurrentTenantId() {
        return requireCurrentAdmin().getTenantId();
    }

    /**
     * 获取当前登录用户会话。
     *
     * @return 当前登录用户会话
     */
    public CurrentAdmin requireCurrentAdmin() {
        CurrentAdmin currentAdmin = AuthContext.get();
        if (currentAdmin == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "未登录或登录已失效");
        }
        if (currentAdmin.getUserId() == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED.value(), "当前登录用户信息无效");
        }
        return currentAdmin;
    }
}
