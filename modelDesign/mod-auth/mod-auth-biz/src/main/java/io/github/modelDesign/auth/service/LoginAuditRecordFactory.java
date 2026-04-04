package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.UserLoginHistory;
import io.github.modelDesign.auth.enums.LoginAuditStatusEnum;
import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * 登录审计记录实体工厂。
 */
@Component
public class LoginAuditRecordFactory {
    /**
     * 把审计写入命令组装为持久化实体。
     *
     * @param command 登录审计写入命令
     * @return 登录历史实体
     */
    public UserLoginHistory create(LoginAuditWriteCommand command) {
        Objects.requireNonNull(command, "登录审计写入命令不能为空");
        Objects.requireNonNull(command.getLoginStatus(), "登录状态不能为空");

        UserLoginHistory record = new UserLoginHistory();
        record.setUserId(command.getUserId());
        record.setTenantId(command.getTenantId());
        record.setLoginId(command.getLoginId());
        record.setLoginIp(resolveLoginIp(command.getLoginIp()));
        record.setLoginType(resolveLoginType(command.getLoginType()));
        record.setLoginStatus(command.getLoginStatus());
        record.setUsername(command.getUsername());
        record.setUserAgent(command.getUserAgent());
        record.setBrowserName(command.getBrowserName());
        record.setBrowserVersion(command.getBrowserVersion());
        record.setOsName(command.getOsName());
        record.setOsVersion(command.getOsVersion());
        record.setDeviceType(resolveDeviceType(command.getDeviceType()));

        if (LoginAuditStatusEnum.SUCCESS.equals(command.getLoginStatus())) {
            record.setFailureReasonCode(null);
            record.setFailureReasonText(null);
        }
        if (LoginAuditStatusEnum.FAILURE.equals(command.getLoginStatus())) {
            record.setFailureReasonCode(command.getFailureReasonCode());
            record.setFailureReasonText(command.getFailureReasonText());
        }
        return record;
    }

    /**
     * 统一兜底登录 IP，避免写库命中非空约束。
     *
     * @param loginIp 命令中的登录 IP
     * @return 非空登录 IP
     */
    private String resolveLoginIp(String loginIp) {
        if (loginIp == null) {
            return "";
        }
        return loginIp;
    }

    /**
     * 统一兜底登录方式，避免写库命中非空约束。
     *
     * @param loginType 命令中的登录方式
     * @return 非空登录方式
     */
    private String resolveLoginType(String loginType) {
        if (loginType == null) {
            return "";
        }
        return loginType;
    }

    /**
     * 统一兜底设备类型，避免写库命中非空约束。
     *
     * @param deviceType 命令中的设备类型
     * @return 非空设备类型
     */
    private LoginDeviceTypeEnum resolveDeviceType(LoginDeviceTypeEnum deviceType) {
        if (deviceType == null) {
            return LoginDeviceTypeEnum.UNKNOWN;
        }
        return deviceType;
    }
}
