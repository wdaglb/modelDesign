package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户登录历史。
 */
@Data
@TableName("userLoginHistory")
@EqualsAndHashCode(callSuper = true)
public class UserLoginHistory extends BaseEntity {
    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * 登录流水号。
     */
    private String loginId;

    /**
     * 登录 IP。
     */
    private String loginIp;

    /**
     * 登录方式。
     */
    private String loginType;
}
