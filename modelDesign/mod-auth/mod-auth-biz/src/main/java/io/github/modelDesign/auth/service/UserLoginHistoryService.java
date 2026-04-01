package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.domain.UserLoginHistory;
import io.github.modelDesign.auth.mapper.UserLoginHistoryMapper;
import io.github.modelDesign.auth.response.LoginHistoryVo;
import io.github.modelDesign.auth.session.CurrentAdmin;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 用户登录历史服务。
 */
@Service
public class UserLoginHistoryService extends ServiceImpl<UserLoginHistoryMapper, UserLoginHistory>
        implements IService<UserLoginHistory> {
    /**
     * 密码登录类型。
     */
    public static final String PASSWORD_LOGIN_TYPE = "PASSWORD";

    /**
     * 记录一次成功的密码登录。
     *
     * @param currentAdmin 当前登录会话
     */
    public void recordPasswordLogin(CurrentAdmin currentAdmin) {
        UserLoginHistory history = new UserLoginHistory();
        history.setUserId(currentAdmin.getUserId());
        history.setTenantId(currentAdmin.getTenantId());
        history.setLoginId(currentAdmin.getLoginId());
        history.setLoginIp(currentAdmin.getLoginIp());
        history.setLoginType(PASSWORD_LOGIN_TYPE);
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
        return lambdaQuery()
                .eq(UserLoginHistory::getUserId, userId)
                .eq(tenantId != null, UserLoginHistory::getTenantId, tenantId)
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
