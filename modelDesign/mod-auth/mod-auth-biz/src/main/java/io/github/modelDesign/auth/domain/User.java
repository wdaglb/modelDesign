package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 后台管理员。
 */
@Data
@TableName("user")
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {
    /**
     * 登录用户名。
     */
    private String username;

    /**
     * 默认租户 ID。
     */
    private Long tenantId;

    /**
     * 基于前端 md5 密码串再次 BCrypt 后的密码摘要。
     */
    private String passwordHash;

    /**
     * 用户昵称。
     */
    private String nickname;

    /**
     * 头像文件标识。
     */
    private String avatarId;

    /**
     * 账号状态，1 表示启用，0 表示禁用。
     */
    private Integer status;

    /**
     * 最近一次登录 IP。
     */
    private String lastLoginIp;

    /**
     * 最近一次登录时间。
     */
    private LocalDateTime lastLoginTime;
}
