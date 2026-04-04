package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.request.UserListRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 用户列表查询上下文工厂测试。
 */
class UserListQueryContextFactoryTest {
    /**
     * 数字关键字应该填充 keywordUserId，其他字段不变。
     */
    @Test
    void numericKeywordSetsUserId() {
        UserListRequest request = new UserListRequest();
        request.setKeyword(" 1024 ");
        request.setHasRole(true);
        request.setHasPosition(false);

        UserListQueryContextFactory factory = new UserListQueryContextFactory();
        UserListQueryContext context = factory.create(request);

        assertEquals(1024L, context.getKeywordUserId());
        assertNull(context.getKeywordText());
        assertTrue(context.getHasRole());
        assertFalse(context.getHasPosition());
        assertFalse(context.hasKeywordText());
    }

    /**
     * 文本关键字会被 trim，且 username 与 nickname 同样 trim。
     */
    @Test
    void textKeywordCleansStrings() {
        UserListRequest request = new UserListRequest();
        request.setKeyword(" alice ");
        request.setUsername("  bob ");
        request.setNickname("  Lilac ");

        UserListQueryContextFactory factory = new UserListQueryContextFactory();
        UserListQueryContext context = factory.create(request);

        assertNull(context.getKeywordUserId());
        assertEquals("alice", context.getKeywordText());
        assertTrue(context.hasKeywordText());
        assertEquals("bob", context.getUsername());
        assertEquals("Lilac", context.getNickname());
    }

    /**
     * 超出 Long 范围的数字关键字应该退化为 keywordText。
     */
    @Test
    void overflowNumericKeywordFallsBackToText() {
        UserListRequest request = new UserListRequest();
        request.setKeyword(" 92233720368547758079223372036854775807 ");

        UserListQueryContextFactory factory = new UserListQueryContextFactory();
        UserListQueryContext context = factory.create(request);

        assertNull(context.getKeywordUserId());
        assertEquals("92233720368547758079223372036854775807", context.getKeywordText());
        assertTrue(context.hasKeywordText());
    }
}
