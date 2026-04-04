package io.github.modelDesign.auth.service;

import lombok.Data;

/**
 * 用户列表查询上下文，封装请求筛选条件。
 */
@Data
public class UserListQueryContext {
    /**
     * 当关键字为纯数字时对应的用户 ID。
     */
    private Long keywordUserId;

    /**
     * 当关键字为文本时对应的搜索词。
     */
    private String keywordText;

    /**
     * 用户名。
     */
    private String username;

    /**
     * 用户昵称。
     */
    private String nickname;

    /**
     * 精确用户 ID。
     */
    private Long userId;

    /**
     * 租户 ID。
     */
    private Long tenantId;

    /**
     * 是否停用。
     */
    private Boolean isDisable;

    /**
     * 是否拥有角色。
     */
    private Boolean hasRole;

    /**
     * 是否拥有岗位。
     */
    private Boolean hasPosition;

    /**
     * 关键字是否包含有效的文本。
     */
    public boolean hasKeywordText() {
        return keywordText != null && !keywordText.isBlank();
    }
}
