package io.github.modelDesign.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import io.github.modelDesign.auth.domain.UserLoginHistory;
import io.github.modelDesign.auth.enums.LoginAuditStatusEnum;
import io.github.modelDesign.auth.enums.LoginDeviceTypeEnum;
import io.github.modelDesign.auth.enums.LoginFailureReasonEnum;
import io.github.modelDesign.auth.mapper.UserLoginHistoryMapper;
import io.github.modelDesign.auth.request.LoginAuditPageRequest;
import io.github.modelDesign.auth.response.LoginAuditPageItemVo;
import io.github.modelDesign.auth.response.LoginHistoryVo;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

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
                .eq(UserLoginHistory::getLoginStatus, LoginAuditStatusEnum.SUCCESS)
                .orderByDesc(UserLoginHistory::getCreateTime)
                .last("limit 10")
                .list()
                .stream()
                .map(UserLoginHistoryService::toLoginHistoryVo)
                .toList();
    }

    /**
     * 分页查询登录审计记录。
     *
     * @param request 分页请求
     * @return 分页结果
     */
    public PageResponse<LoginAuditPageItemVo> getLoginAuditPage(
            LoginAuditPageRequest request
    ) {
        if (request == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "请求参数不能为空");
        }
        if (request.getTenantId() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "租户不能为空");
        }
        long current = requirePositivePageValue(request.getCurrent(), "页码");
        long pageSize = requirePositivePageValue(request.getPageSize(), "每页条数");
        String username = normalizeQueryKeyword(request.getUsername());
        String loginType = normalizeQueryKeyword(request.getLoginType());

        Page<UserLoginHistory> pageRequest = new Page<>(current, pageSize);
        Page<UserLoginHistory> pageResult = lambdaQuery()
                .like(
                        StringUtils.hasText(username),
                        UserLoginHistory::getUsername,
                        username
                )
                .eq(UserLoginHistory::getTenantId, request.getTenantId())
                .eq(
                        request.getLoginStatus() != null,
                        UserLoginHistory::getLoginStatus,
                        request.getLoginStatus()
                )
                .eq(
                        StringUtils.hasText(loginType),
                        UserLoginHistory::getLoginType,
                        loginType
                )
                .eq(
                        request.getDeviceType() != null,
                        UserLoginHistory::getDeviceType,
                        request.getDeviceType()
                )
                .orderByDesc(UserLoginHistory::getCreateTime)
                .page(pageRequest);
        List<LoginAuditPageItemVo> items = pageResult.getRecords().stream()
                .map(UserLoginHistoryService::toLoginAuditPageItemVo)
                .toList();
        return new PageResponse<>(items, pageResult.getTotal());
    }

    /**
     * 将登录历史实体转换为当前用户视图。
     *
     * @param history 登录历史实体
     * @return 视图对象
     */
    static LoginHistoryVo toLoginHistoryVo(UserLoginHistory history) {
        return LoginHistoryVo.builder()
                .loginId(history.getLoginId())
                .loginIp(history.getLoginIp())
                .loginType(history.getLoginType())
                .loginTime(history.getCreateTime())
                .browserName(history.getBrowserName())
                .browserVersion(history.getBrowserVersion())
                .osName(history.getOsName())
                .osVersion(history.getOsVersion())
                .deviceType(resolveDeviceTypeValue(history.getDeviceType()))
                .build();
    }

    /**
     * 将登录历史实体转换为审计分页项。
     *
     * @param history 登录历史实体
     * @return 分页项
     */
    static LoginAuditPageItemVo toLoginAuditPageItemVo(UserLoginHistory history) {
        return LoginAuditPageItemVo.builder()
                .id(history.getId())
                .userId(history.getUserId())
                .username(history.getUsername())
                .tenantId(history.getTenantId())
                .loginId(history.getLoginId())
                .loginIp(history.getLoginIp())
                .loginStatus(resolveLoginStatusValue(history.getLoginStatus()))
                .loginType(history.getLoginType())
                .loginTime(history.getCreateTime())
                .userAgent(history.getUserAgent())
                .browserName(history.getBrowserName())
                .browserVersion(history.getBrowserVersion())
                .osName(history.getOsName())
                .osVersion(history.getOsVersion())
                .deviceType(resolveDeviceTypeValue(history.getDeviceType()))
                .failureReasonCode(resolveFailureReasonValue(
                        history.getFailureReasonCode()
                ))
                .failureReasonText(history.getFailureReasonText())
                .build();
    }

    /**
     * 将枚举设备类型转换为字符串值。
     *
     * @param deviceType 设备类型枚举
     * @return 字符串值
     */
    private static String resolveDeviceTypeValue(LoginDeviceTypeEnum deviceType) {
        if (deviceType == null) {
            return null;
        }
        return deviceType.getValue();
    }

    /**
     * 将枚举登录状态转换为字符串值。
     *
     * @param loginStatus 登录状态枚举
     * @return 字符串值
     */
    private static String resolveLoginStatusValue(
            LoginAuditStatusEnum loginStatus
    ) {
        if (loginStatus == null) {
            return null;
        }
        return loginStatus.getValue();
    }

    /**
     * 将枚举失败原因转换为字符串值。
     *
     * @param reasonCode 失败原因枚举
     * @return 字符串值
     */
    private static String resolveFailureReasonValue(
            LoginFailureReasonEnum reasonCode
    ) {
        if (reasonCode == null) {
            return null;
        }
        return reasonCode.getValue();
    }

    /**
     * 归一化查询关键字，空白字符串返回 null。
     *
     * @param keyword 关键字
     * @return 归一化结果
     */
    private String normalizeQueryKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String trimmedKeyword = keyword.trim();
        if (!StringUtils.hasText(trimmedKeyword)) {
            return null;
        }
        return trimmedKeyword;
    }

    /**
     * 校验分页参数必须为正整数。
     *
     * @param value 参数值
     * @param fieldName 字段名称
     * @return 合法分页值
     */
    private long requirePositivePageValue(Long value, String fieldName) {
        if (value == null) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    fieldName + "不能为空"
            );
        }
        if (value < 1) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST.value(),
                    fieldName + "不能小于 1"
            );
        }
        return value;
    }
}
