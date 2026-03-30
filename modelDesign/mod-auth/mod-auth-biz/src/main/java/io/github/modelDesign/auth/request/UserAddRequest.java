package io.github.modelDesign.auth.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新增用户请求。
 *
 * 对应用户管理页面中的“添加用户”弹窗，包含基础资料、初始密码和状态信息。
 */
@Data
public class UserAddRequest {
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
     * 前端会先传入一次 md5 处理后的值，后端再继续进行 BCrypt 编码后入库。
     */
    @NotBlank(message = "密码不能为空")
    private String password;

    /**
     * 是否禁用。
     *
     * `true` 表示新增后直接禁用，`false` 表示新增后即为启用状态。
     */
    private Boolean isDisable;
}
