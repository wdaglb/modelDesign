package io.github.modelDesign.auth.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 编辑用户请求。
 *
 * 对应用户管理页面中的“编辑用户”弹窗，支持更新基础信息、密码和启用状态。
 */
@Data
public class UserUpdateRequest {
    /**
     * 用户昵称。
     *
     * 用于后台列表展示与页面中的名称识别。
     */
    @NotBlank(message = "用户昵称不能为空")
    @Size(max = 50, message = "用户昵称长度不能超过 50 个字符")
    private String nickname;

    /**
     * 用户名。
     *
     * 用作登录账号，要求在系统内保持唯一。
     */
    @NotBlank(message = "用户名不能为空")
    @Size(max = 50, message = "用户名长度不能超过 50 个字符")
    private String username;

    /**
     * 密码。
     *
     * 允许为空；为空时表示保留原密码不变。
     */
    private String password;

    /**
     * 是否禁用。
     *
     * `true` 表示禁用，`false` 表示启用。
     */
    private Boolean isDisable;
}
