package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.domain.UserLoginHistory;
import io.github.modelDesign.auth.mapper.UserLoginHistoryMapper;
import io.github.modelDesign.auth.response.LoginHistoryVo;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 用户登录历史服务。
 */
@Service
@RequiredArgsConstructor
public class UserLoginHistoryService extends ServiceImpl<UserLoginHistoryMapper, UserLoginHistory>
        implements IService<UserLoginHistory> {
    /**
     * 密码登录类型。
     */
    public static final String PASSWORD_LOGIN_TYPE = "PASSWORD";

    /**
     * 登录审计记录实体工厂。
     */
    private final LoginAuditRecordFactory loginAuditRecordFactory;

    /**
     * 写入登录审计记录。
     *
     * @param command 登录审计写入命令
     */
    public void record(LoginAuditWriteCommand command) {
        UserLoginHistory history = loginAuditRecordFactory.create(command);
        save(history);
    }

    /**
     * 查询当前用户最近登录历史。
     *
     * @param userId   用户 ID
     * @param tenantId 租户 ID
     * @return 最近登录历史
     */
    public List<LoginHistoryVo> getRecentLoginHistory(Long userId, Long tenantId) {
        if (tenantId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户不能为空");
        }
        return lambdaQuery()
                .eq(UserLoginHistory::getUserId, userId)
                .eq(UserLoginHistory::getTenantId, tenantId)
                .orderByDesc(UserLoginHistory::getCreateTime)
                .last("limit 10")
                .list()
                .stream()
                .map(this::toVo)
                .toList();
    }

    private LoginHistoryVo toVo(UserLoginHistory history) {
        return LoginHistoryVo.builder()
                .loginId(history.getLoginId())
                .loginIp(history.getLoginIp())
                .loginType(history.getLoginType())
                .loginTime(history.getCreateTime())
                .build();
    }
}
