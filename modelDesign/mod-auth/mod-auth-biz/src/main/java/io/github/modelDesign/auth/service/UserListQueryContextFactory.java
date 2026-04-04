package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.request.UserListRequest;
import org.springframework.stereotype.Component;

/**
 * 用户列表查询上下文工厂。
 */
@Component
public class UserListQueryContextFactory {
    /**
     * 从请求构造查询上下文，自动清洗字符串并解析关键字。
     */
    public UserListQueryContext create(UserListRequest request) {
        if (request == null) {
            return null;
        }

        UserListQueryContext context = new UserListQueryContext();
        context.setTenantId(request.getTenantId());
        context.setUserId(request.getUserId());
        context.setIsDisable(request.getIsDisable());
        context.setHasRole(request.getHasRole());
        context.setHasPosition(request.getHasPosition());

        String keyword = trimToNull(request.getKeyword());
        if (keyword != null) {
            if (keyword.chars().allMatch(Character::isDigit)) {
                try {
                    context.setKeywordUserId(Long.valueOf(keyword));
                } catch (NumberFormatException ex) {
                    context.setKeywordText(keyword);
                }
            } else {
                context.setKeywordText(keyword);
            }
        }

        context.setUsername(trimToNull(request.getUsername()));
        context.setNickname(trimToNull(request.getNickname()));

        return context;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed;
    }
}
