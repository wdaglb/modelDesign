# 用户管理前后端重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留现有用户管理主链路的前提下，完成“精炼专业式”重设计，交付统一搜索、高级筛选、首屏角色/职位摘要、优化后的表格操作层级，以及分组更清晰的新增/编辑体验。

**Architecture:** 后端继续沿用 `/user/list` 单一入口，但把查询模型拆成“请求模型 + 纯粹的查询上下文工厂 + 摘要聚合器”三层，避免 `UserService` 继续膨胀。前端继续以 `KTable + KModal` 为壳层，通过新增私有组件把工具栏、筛选面板、账号信息单元格、操作菜单拆开，用纯 helper 锁定参数组装，再做界面重组和回归。

**Tech Stack:** Spring Boot 3.5、MyBatis-Plus、Spring MVC、JUnit 5、Mockito、React 18、TypeScript、TanStack Query、Ant Design、Vitest

---

## 文件结构

- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/UserListRequest.java`
  - 扩展用户列表查询参数，承载 `keyword`、`userId`、`isDisable`、`hasRole`、`hasPosition` 等字段。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/UserListItemVo.java`
  - 扩展角色/职位摘要、最近登录时间、更新时间等前端首屏展示字段。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserListQueryContext.java`
  - 收敛列表查询规范化结果，避免 `UserService` 反复做空值与关键字判断。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserListQueryContextFactory.java`
  - 纯工厂，负责把 `UserListRequest` 转成统一查询上下文，便于单元测试。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserListViewAssembler.java`
  - 批量聚合租户、角色、职位和时间字段，输出 `UserListItemVo`。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserService.java`
  - 调整列表查询流程：基础条件过滤、摘要聚合、治理筛选、分页输出。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PermissionService.java`
  - 增加按用户批量读取角色编码的能力。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserPositionService.java`
  - 增加按用户批量读取职位 ID 的能力。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/RoleService.java`
  - 增加按角色编码批量读取角色名称的能力。
- `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PositionService.java`
  - 增加按职位 ID 批量读取职位名称的能力。
- `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/UserListQueryContextFactoryTest.java`
  - 锁定 `keyword` 和高级筛选参数的规范化行为。
- `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/UserListViewAssemblerTest.java`
  - 锁定角色/职位摘要与时间字段组装行为。
- `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/controller/UserControllerListContractTest.java`
  - 锁定 `/user/list` 的新查询参数能正确绑定到请求对象。
- `admin-rsbuild/src/api/modules/user.ts`
  - 扩展前端用户列表类型与请求参数类型。
- `admin-rsbuild/src/routes/system/user/#userQueryHelper.ts`
  - 统一组装列表查询参数，避免视图组件中散落业务判断。
- `admin-rsbuild/src/routes/system/user/#user.styled.tsx`
  - 收口标题区、筛选区、摘要信息的私有样式。
- `admin-rsbuild/src/routes/system/user/#UserToolbar.tsx`
  - 统一搜索、批量操作按钮、高级筛选开关。
- `admin-rsbuild/src/routes/system/user/#UserAdvancedFilter.tsx`
  - 高级筛选面板，承载账号维度与治理维度筛选项。
- `admin-rsbuild/src/routes/system/user/#UserInfoCell.tsx`
  - 账号信息单元格展示。
- `admin-rsbuild/src/routes/system/user/#UserActionMenu.tsx`
  - 行内操作主次分层。
- `admin-rsbuild/src/routes/system/user/#UserTable.tsx`
  - 重组列表查询、列定义和工具栏装配逻辑。
- `admin-rsbuild/src/routes/system/user/#CreateUserForm.tsx`
  - 优化新增用户表单分组与结果确认排版。
- `admin-rsbuild/src/routes/system/user/#UpdateUserForm.tsx`
  - 优化编辑用户表单分组与只读辅助信息。
- `admin-rsbuild/src/routes/system/user/__tests__/userQueryHelper.test.ts`
  - 锁定前端查询参数组装规则。
- `admin-rsbuild/src/routes/system/user/__tests__/UserToolbar.test.tsx`
  - 锁定搜索与高级筛选交互。
- `admin-rsbuild/src/routes/system/user/__tests__/UserTable.test.tsx`
  - 锁定首屏关键渲染、空态文案和操作层级。

### Task 1: 锁定后端查询上下文合同

**Files:**
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserListQueryContext.java`
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserListQueryContextFactory.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/UserListRequest.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/UserListQueryContextFactoryTest.java`

- [ ] **Step 1: 先写查询上下文失败用例**

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.request.UserListRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserListQueryContextFactoryTest {
    private final UserListQueryContextFactory factory = new UserListQueryContextFactory();

    @Test
    void createShouldExtractKeywordUserIdWhenKeywordIsNumeric() {
        UserListRequest request = new UserListRequest();
        request.setKeyword(" 1024 ");
        request.setHasRole(Boolean.TRUE);
        request.setHasPosition(Boolean.FALSE);

        UserListQueryContext context = factory.create(request);

        assertEquals(1024L, context.getKeywordUserId());
        assertNull(context.getKeywordText());
        assertTrue(context.getHasRole());
        assertFalse(context.getHasPosition());
    }

    @Test
    void createShouldKeepKeywordTextWhenKeywordIsNotNumeric() {
        UserListRequest request = new UserListRequest();
        request.setKeyword(" alice ");
        request.setUsername(" admin ");
        request.setNickname(" 运营 ");

        UserListQueryContext context = factory.create(request);

        assertNull(context.getKeywordUserId());
        assertEquals("alice", context.getKeywordText());
        assertEquals("admin", context.getUsername());
        assertEquals("运营", context.getNickname());
    }
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=UserListQueryContextFactoryTest test`

Expected: FAIL，提示 `UserListQueryContextFactory` 或新增字段不存在。

- [ ] **Step 3: 扩展请求模型并实现查询上下文**

```java
package io.github.modelDesign.auth.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "用户列表请求")
public class UserListRequest {
    @Schema(description = "页码")
    @Min(value = 1, message = "页码不能小于 1")
    private Long current = 1L;

    @Schema(description = "每页条数")
    @Min(value = 1, message = "每页条数不能小于 1")
    private Long pageSize = 10L;

    @Schema(description = "用户 ID 列表")
    private List<Long> ids;

    @Schema(description = "统一搜索关键字")
    private String keyword;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "昵称")
    private String nickname;

    @Schema(description = "用户 ID")
    private Long userId;

    @Schema(description = "租户 ID")
    private Long tenantId;

    @Schema(description = "是否禁用")
    private Boolean isDisable;

    @Schema(description = "是否已绑定角色")
    private Boolean hasRole;

    @Schema(description = "是否已绑定职位")
    private Boolean hasPosition;
}
```

```java
package io.github.modelDesign.auth.service;

import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Getter
@Builder
public class UserListQueryContext {
    private Long keywordUserId;
    private String keywordText;
    private String username;
    private String nickname;
    private Long userId;
    private Long tenantId;
    private Boolean isDisable;
    private Boolean hasRole;
    private Boolean hasPosition;

    public boolean hasKeywordText() {
        return StringUtils.hasText(keywordText);
    }
}
```

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.request.UserListRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class UserListQueryContextFactory {
    public UserListQueryContext create(UserListRequest request) {
        String normalizedKeyword = normalize(request.getKeyword());
        Long keywordUserId = null;
        String keywordText = null;
        if (StringUtils.hasText(normalizedKeyword)) {
            if (normalizedKeyword.chars().allMatch(Character::isDigit)) {
                keywordUserId = Long.parseLong(normalizedKeyword);
            } else {
                keywordText = normalizedKeyword;
            }
        }

        return UserListQueryContext.builder()
                .keywordUserId(keywordUserId)
                .keywordText(keywordText)
                .username(normalize(request.getUsername()))
                .nickname(normalize(request.getNickname()))
                .userId(request.getUserId())
                .tenantId(request.getTenantId())
                .isDisable(request.getIsDisable())
                .hasRole(request.getHasRole())
                .hasPosition(request.getHasPosition())
                .build();
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
```

- [ ] **Step 4: 重新运行查询上下文测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=UserListQueryContextFactoryTest test`

Expected: PASS，`UserListQueryContextFactoryTest` 全部通过。

- [ ] **Step 5: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/request/UserListRequest.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserListQueryContext.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserListQueryContextFactory.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/UserListQueryContextFactoryTest.java
git commit -m "test(user): 锁定用户列表查询上下文"
```

### Task 2: 实现后端摘要聚合与列表响应扩展

**Files:**
- Create: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserListViewAssembler.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/UserListItemVo.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PermissionService.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserPositionService.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/RoleService.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PositionService.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/UserListViewAssemblerTest.java`

- [ ] **Step 1: 先写摘要组装失败用例**

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.response.UserListItemVo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserListViewAssemblerTest {
    @Mock
    private PermissionService permissionService;
    @Mock
    private RoleService roleService;
    @Mock
    private UserPositionService userPositionService;
    @Mock
    private PositionService positionService;
    @Mock
    private TenantService tenantService;

    @InjectMocks
    private UserListViewAssembler assembler;

    @Test
    void assembleShouldFillRolePositionAndTimeSummary() {
        User user = new User();
        user.setId(7L);
        user.setUsername("alice");
        user.setNickname("艾丽丝");
        user.setTenantId(2L);
        user.setStatus(1);
        user.setLastLoginTime(LocalDateTime.of(2026, 4, 4, 10, 30));
        user.setUpdateTime(LocalDateTime.of(2026, 4, 4, 11, 45));

        when(permissionService.getUserRolesMap(List.of(7L)))
                .thenReturn(Map.of(7L, List.of("admin")));
        when(roleService.getNameMapByCodes(List.of("admin")))
                .thenReturn(Map.of("admin", "管理员"));
        when(userPositionService.getUserPositionIdsMap(List.of(7L)))
                .thenReturn(Map.of(7L, List.of(3L)));
        when(positionService.getNameMapByIds(List.of(3L)))
                .thenReturn(Map.of(3L, "产品负责人"));
        when(tenantService.getDisplayNameMapByIds(List.of(2L)))
                .thenReturn(Map.of(2L, "总部租户"));

        UserListItemVo item = assembler.assemble(List.of(user)).get(0);

        assertEquals(List.of("管理员"), item.getRoleNames());
        assertEquals(List.of("产品负责人"), item.getPositionNames());
        assertEquals("总部租户", item.getTenantName());
        assertTrue(item.getHasRole());
        assertTrue(item.getHasPosition());
        assertFalse(item.getIsDisable());
    }
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=UserListViewAssemblerTest test`

Expected: FAIL，提示 `UserListViewAssembler` 和新增批量方法不存在。

- [ ] **Step 3: 扩展响应模型与批量摘要能力**

```java
package io.github.modelDesign.auth.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@Schema(description = "用户列表项")
public class UserListItemVo {
    private Long id;
    private String nickname;
    private String username;
    private Long tenantId;
    private String tenantName;
    private String avatarId;
    private Boolean isDisable;
    private List<String> roleNames;
    private List<String> positionNames;
    private Boolean hasRole;
    private Boolean hasPosition;
    private String lastLoginTime;
    private String updatedAt;
}
```

```java
package io.github.modelDesign.auth.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PermissionService {
    public Map<Long, List<String>> getUserRolesMap(Collection<Long> userIds) {
        Map<Long, List<String>> result = new LinkedHashMap<>();
        if (userIds == null || userIds.isEmpty()) {
            return result;
        }
        for (Long userId : userIds) {
            if (userId == null) {
                continue;
            }
            result.put(userId, new ArrayList<>(getUserRoles(String.valueOf(userId))));
        }
        return result;
    }
}
```

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.UserPosition;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserPositionService {
    public Map<Long, List<Long>> getUserPositionIdsMap(Collection<Long> userIds) {
        Map<Long, List<Long>> result = new LinkedHashMap<>();
        if (userIds == null || userIds.isEmpty()) {
            return result;
        }
        List<UserPosition> relations = lambdaQuery()
                .in(UserPosition::getUserId, userIds)
                .orderByAsc(UserPosition::getId)
                .list();
        for (UserPosition relation : relations) {
            result.computeIfAbsent(relation.getUserId(), key -> new ArrayList<>())
                    .add(relation.getPositionId());
        }
        return result;
    }
}
```

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.Role;
import io.github.modelDesign.auth.domain.Position;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class RoleService {
    public Map<String, String> getNameMapByCodes(Collection<String> codes) {
        Map<String, String> result = new LinkedHashMap<>();
        if (codes == null || codes.isEmpty()) {
            return result;
        }
        List<Role> roles = lambdaQuery().in(Role::getCode, codes).list();
        for (Role role : roles) {
            result.put(role.getCode(), role.getName());
        }
        return result;
    }
}

public class PositionService {
    public Map<Long, String> getNameMapByIds(Collection<Long> ids) {
        Map<Long, String> result = new LinkedHashMap<>();
        if (ids == null || ids.isEmpty()) {
            return result;
        }
        List<Position> positions = listByIds(ids);
        for (Position position : positions) {
            result.put(position.getId(), position.getName());
        }
        return result;
    }
}
```

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.response.UserListItemVo;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Component
public class UserListViewAssembler {
    private static final DateTimeFormatter DATETIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final PermissionService permissionService;
    private final RoleService roleService;
    private final UserPositionService userPositionService;
    private final PositionService positionService;
    private final TenantService tenantService;

    public UserListViewAssembler(
            PermissionService permissionService,
            RoleService roleService,
            UserPositionService userPositionService,
            PositionService positionService,
            TenantService tenantService) {
        this.permissionService = permissionService;
        this.roleService = roleService;
        this.userPositionService = userPositionService;
        this.positionService = positionService;
        this.tenantService = tenantService;
    }

    public List<UserListItemVo> assemble(List<User> users) {
        List<Long> userIds = users.stream().map(User::getId).filter(Objects::nonNull).toList();
        Map<Long, List<String>> userRoleCodesMap = permissionService.getUserRolesMap(userIds);
        Set<String> allRoleCodes = new LinkedHashSet<>();
        for (List<String> codes : userRoleCodesMap.values()) {
            allRoleCodes.addAll(codes);
        }
        Map<String, String> roleNameMap = roleService.getNameMapByCodes(allRoleCodes);

        Map<Long, List<Long>> userPositionIdsMap = userPositionService.getUserPositionIdsMap(userIds);
        Set<Long> allPositionIds = new LinkedHashSet<>();
        for (List<Long> ids : userPositionIdsMap.values()) {
            allPositionIds.addAll(ids);
        }
        Map<Long, String> positionNameMap = positionService.getNameMapByIds(allPositionIds);

        Set<Long> tenantIds = users.stream().map(User::getTenantId).filter(Objects::nonNull).collect(LinkedHashSet::new, Set::add, Set::addAll);
        Map<Long, String> tenantNameMap = tenantService.getDisplayNameMapByIds(tenantIds);

        List<UserListItemVo> items = new ArrayList<>();
        for (User user : users) {
            List<String> roleNames = new ArrayList<>();
            for (String code : userRoleCodesMap.getOrDefault(user.getId(), List.of())) {
                String mappedName = roleNameMap.get(code);
                if (mappedName != null) {
                    roleNames.add(mappedName);
                }
            }

            List<String> positionNames = new ArrayList<>();
            for (Long positionId : userPositionIdsMap.getOrDefault(user.getId(), List.of())) {
                String mappedName = positionNameMap.get(positionId);
                if (mappedName != null) {
                    positionNames.add(mappedName);
                }
            }

            String lastLoginTime = null;
            if (user.getLastLoginTime() != null) {
                lastLoginTime = user.getLastLoginTime().format(DATETIME_FORMATTER);
            }
            String updatedAt = null;
            if (user.getUpdateTime() != null) {
                updatedAt = user.getUpdateTime().format(DATETIME_FORMATTER);
            }

            items.add(UserListItemVo.builder()
                    .id(user.getId())
                    .nickname(user.getNickname())
                    .username(user.getUsername())
                    .tenantId(user.getTenantId())
                    .tenantName(tenantNameMap.getOrDefault(user.getTenantId(), ""))
                    .avatarId(user.getAvatarId())
                    .isDisable(!Objects.equals(user.getStatus(), 1))
                    .roleNames(roleNames)
                    .positionNames(positionNames)
                    .hasRole(!roleNames.isEmpty())
                    .hasPosition(!positionNames.isEmpty())
                    .lastLoginTime(lastLoginTime)
                    .updatedAt(updatedAt)
                    .build());
        }
        return items;
    }
}
```

- [ ] **Step 4: 重新运行摘要组装测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=UserListViewAssemblerTest test`

Expected: PASS，`UserListViewAssemblerTest` 通过。

- [ ] **Step 5: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/response/UserListItemVo.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserListViewAssembler.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PermissionService.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserPositionService.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/RoleService.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/PositionService.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/service/UserListViewAssemblerTest.java
git commit -m "feat(user): 扩展用户列表摘要信息"
```

### Task 3: 接入后端列表查询流程并锁定控制器合同

**Files:**
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserService.java`
- Modify: `modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/UserController.java`
- Test: `modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/controller/UserControllerListContractTest.java`

- [ ] **Step 1: 先写控制器查询合同失败用例**

```java
package io.github.modelDesign.auth.controller;

import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.UserListItemVo;
import io.github.modelDesign.auth.service.PermissionService;
import io.github.modelDesign.auth.service.UserPositionService;
import io.github.modelDesign.auth.service.UserService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerListContractTest {
    @Test
    void listShouldBindKeywordAndGovernanceFilters() throws Exception {
        UserService userService = mock(UserService.class);
        PermissionService permissionService = mock(PermissionService.class);
        UserPositionService userPositionService = mock(UserPositionService.class);
        when(userService.getList(any())).thenReturn(new PageResponse<>(java.util.List.<UserListItemVo>of(), 0));

        UserController controller = new UserController(userService, permissionService, userPositionService);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        mockMvc.perform(get("/user/list")
                        .param("keyword", "alice")
                        .param("username", "admin")
                        .param("userId", "1024")
                        .param("isDisable", "false")
                        .param("hasRole", "true")
                        .param("hasPosition", "false"))
                .andExpect(status().isOk());

        ArgumentCaptor<io.github.modelDesign.auth.request.UserListRequest> captor =
                ArgumentCaptor.forClass(io.github.modelDesign.auth.request.UserListRequest.class);
        verify(userService).getList(captor.capture());
        assertEquals("alice", captor.getValue().getKeyword());
        assertEquals("admin", captor.getValue().getUsername());
        assertEquals(1024L, captor.getValue().getUserId());
        assertEquals(Boolean.TRUE, captor.getValue().getHasRole());
        assertEquals(Boolean.FALSE, captor.getValue().getHasPosition());
    }
}
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=UserControllerListContractTest test`

Expected: FAIL，提示新参数未被正确绑定或测试类缺失。

- [ ] **Step 3: 改造列表服务流程并补 Swagger 说明**

```java
package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.domain.User;
import io.github.modelDesign.auth.request.UserListRequest;
import io.github.modelDesign.auth.response.PageResponse;
import io.github.modelDesign.auth.response.UserListItemVo;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
public class UserService {
    private final TenantService tenantService;
    private final UserListQueryContextFactory userListQueryContextFactory;
    private final UserListViewAssembler userListViewAssembler;

    public PageResponse<UserListItemVo> getList(UserListRequest request) {
        UserListQueryContext context = userListQueryContextFactory.create(request);
        List<Long> ids = Collections.emptyList();
        if (request.getIds() != null) {
            ids = request.getIds().stream().filter(Objects::nonNull).distinct().toList();
        }
        Integer status = null;
        if (context.getIsDisable() != null) {
            if (Boolean.TRUE.equals(context.getIsDisable())) {
                status = 0;
            } else {
                status = 1;
            }
        }

        List<User> baseUsers = lambdaQuery()
                .in(!ids.isEmpty(), User::getId, ids)
                .eq(context.getUserId() != null, User::getId, context.getUserId())
                .eq(context.getKeywordUserId() != null, User::getId, context.getKeywordUserId())
                .like(StringUtils.hasText(context.getUsername()), User::getUsername, context.getUsername())
                .like(StringUtils.hasText(context.getNickname()), User::getNickname, context.getNickname())
                .and(context.hasKeywordText(), wrapper -> wrapper
                        .like(User::getUsername, context.getKeywordText())
                        .or()
                        .like(User::getNickname, context.getKeywordText()))
                .eq(context.getTenantId() != null, User::getTenantId, context.getTenantId())
                .eq(status != null, User::getStatus, status)
                .orderByDesc(User::getUpdateTime)
                .list();

        List<UserListItemVo> items = userListViewAssembler.assemble(baseUsers).stream()
                .filter(item -> {
                    if (context.getHasRole() == null) {
                        return true;
                    }
                    return Objects.equals(context.getHasRole(), item.getHasRole());
                })
                .filter(item -> {
                    if (context.getHasPosition() == null) {
                        return true;
                    }
                    return Objects.equals(context.getHasPosition(), item.getHasPosition());
                })
                .toList();

        long total = items.size();
        long fromIndex = Math.max((request.getCurrent() - 1) * request.getPageSize(), 0);
        if (fromIndex >= total) {
            return new PageResponse<>(Collections.emptyList(), total);
        }
        long toIndex = Math.min(fromIndex + request.getPageSize(), total);
        return new PageResponse<>(items.subList((int) fromIndex, (int) toIndex), total);
    }
}
```

```java
/**
 * 获取用户列表。
 *
 * 支持统一搜索、高级筛选和治理状态筛选。
 *
 * @param request 列表请求
 * @return 分页结果
 */
@Operation(summary = "获取用户列表")
@GetMapping("/list")
public PageResponse<UserListItemVo> list(@Valid UserListRequest request) {
    return userService.getList(request);
}
```

- [ ] **Step 4: 运行后端合同测试**

Run: `cd modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=UserControllerListContractTest,UserListQueryContextFactoryTest,UserListViewAssemblerTest test`

Expected: PASS，三个测试类全部通过。

- [ ] **Step 5: 提交这一小步**

```bash
git add modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/service/UserService.java \
  modelDesign/mod-auth/mod-auth-biz/src/main/java/io/github/modelDesign/auth/controller/UserController.java \
  modelDesign/mod-auth/mod-auth-biz/src/test/java/io/github/modelDesign/auth/controller/UserControllerListContractTest.java
git commit -m "feat(user): 接入用户列表高级筛选链路"
```

### Task 4: 锁定前端查询参数组装与 API 类型

**Files:**
- Modify: `admin-rsbuild/src/api/modules/user.ts`
- Create: `admin-rsbuild/src/routes/system/user/#userQueryHelper.ts`
- Test: `admin-rsbuild/src/routes/system/user/__tests__/userQueryHelper.test.ts`

- [ ] **Step 1: 先写前端参数组装失败用例**

```ts
import { describe, expect, it } from 'vitest';

import { buildUserPageParams, createDefaultUserFilterValues } from '../#userQueryHelper';

describe('userQueryHelper', () => {
  it('统一搜索应写入 keyword 并保留分页参数', () => {
    const params = buildUserPageParams(
      { current: 2, pageSize: 20 },
      {
        ...createDefaultUserFilterValues(),
        keyword: 'alice',
      },
    );

    expect(params).toEqual({
      current: 2,
      pageSize: 20,
      keyword: 'alice',
    });
  });

  it('高级筛选应去掉空值并保留布尔筛选', () => {
    const params = buildUserPageParams(
      { current: 1, pageSize: 10 },
      {
        keyword: '',
        username: 'admin',
        nickname: '',
        userId: 1024,
        tenantId: undefined,
        isDisable: false,
        hasRole: true,
        hasPosition: undefined,
      },
    );

    expect(params).toEqual({
      current: 1,
      pageSize: 10,
      username: 'admin',
      userId: 1024,
      isDisable: false,
      hasRole: true,
    });
  });
});
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd admin-rsbuild && pnpm vitest run src/routes/system/user/__tests__/userQueryHelper.test.ts`

Expected: FAIL，提示 `#userQueryHelper` 不存在。

- [ ] **Step 3: 扩展 API 类型并实现参数 helper**

```ts
export interface User {
  id: number;
  nickname: string;
  username: string;
  tenantId?: number;
  tenantName?: string;
  avatarId: string;
  isDisable?: boolean;
  roleNames?: string[];
  positionNames?: string[];
  hasRole?: boolean;
  hasPosition?: boolean;
  lastLoginTime?: string;
  updatedAt?: string;
}

export interface UserPageParams {
  current?: number;
  pageSize?: number;
  ids?: number[];
  keyword?: string;
  username?: string;
  nickname?: string;
  userId?: number;
  tenantId?: number;
  isDisable?: boolean;
  hasRole?: boolean;
  hasPosition?: boolean;
}
```

```ts
import type { UserPageParams } from '@/api/modules/user';

export interface UserFilterValues {
  keyword: string;
  username?: string;
  nickname?: string;
  userId?: number;
  tenantId?: number;
  isDisable?: boolean;
  hasRole?: boolean;
  hasPosition?: boolean;
}

export function createDefaultUserFilterValues(): UserFilterValues {
  return {
    keyword: '',
    username: undefined,
    nickname: undefined,
    userId: undefined,
    tenantId: undefined,
    isDisable: undefined,
    hasRole: undefined,
    hasPosition: undefined,
  };
}

export function buildUserPageParams(
  pagination: { current: number; pageSize: number },
  filters: UserFilterValues,
): UserPageParams {
  const params: UserPageParams = {
    current: pagination.current,
    pageSize: pagination.pageSize,
  };

  const keyword = filters.keyword.trim();
  if (keyword) {
    params.keyword = keyword;
  }
  if (filters.username) {
    params.username = filters.username.trim();
  }
  if (filters.nickname) {
    params.nickname = filters.nickname.trim();
  }
  if (typeof filters.userId === 'number') {
    params.userId = filters.userId;
  }
  if (typeof filters.tenantId === 'number') {
    params.tenantId = filters.tenantId;
  }
  if (typeof filters.isDisable === 'boolean') {
    params.isDisable = filters.isDisable;
  }
  if (typeof filters.hasRole === 'boolean') {
    params.hasRole = filters.hasRole;
  }
  if (typeof filters.hasPosition === 'boolean') {
    params.hasPosition = filters.hasPosition;
  }

  return params;
}

export function hasAdvancedUserFilterValue(filters: UserFilterValues) {
  if (filters.username) {
    return true;
  }
  if (filters.nickname) {
    return true;
  }
  if (typeof filters.userId === 'number') {
    return true;
  }
  if (typeof filters.tenantId === 'number') {
    return true;
  }
  if (typeof filters.isDisable === 'boolean') {
    return true;
  }
  if (typeof filters.hasRole === 'boolean') {
    return true;
  }
  if (typeof filters.hasPosition === 'boolean') {
    return true;
  }
  return false;
}
```

- [ ] **Step 4: 重新运行 helper 测试**

Run: `cd admin-rsbuild && pnpm vitest run src/routes/system/user/__tests__/userQueryHelper.test.ts`

Expected: PASS，`userQueryHelper.test.ts` 全部通过。

- [ ] **Step 5: 提交这一小步**

```bash
git add admin-rsbuild/src/api/modules/user.ts \
  admin-rsbuild/src/routes/system/user/#userQueryHelper.ts \
  admin-rsbuild/src/routes/system/user/__tests__/userQueryHelper.test.ts
git commit -m "test(user-ui): 锁定用户列表前端查询参数"
```

### Task 5: 拆分工具栏与高级筛选交互

**Files:**
- Create: `admin-rsbuild/src/routes/system/user/#user.styled.tsx`
- Create: `admin-rsbuild/src/routes/system/user/#UserToolbar.tsx`
- Create: `admin-rsbuild/src/routes/system/user/#UserAdvancedFilter.tsx`
- Test: `admin-rsbuild/src/routes/system/user/__tests__/UserToolbar.test.tsx`

- [ ] **Step 1: 先写工具栏交互失败用例**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserToolbar from '../#UserToolbar';
import { createDefaultUserFilterValues } from '../#userQueryHelper';

describe('UserToolbar', () => {
  it('点击搜索会把 keyword 传回父级', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(
      <UserToolbar
        keyword={''}
        advancedOpen={false}
        selectedCount={0}
        onKeywordChange={vi.fn()}
        onSearch={onSearch}
        onToggleAdvanced={vi.fn()}
        onOpenCreate={vi.fn()}
        onOpenBatch={vi.fn()}
      />,
    );

    await user.type(
      screen.getByPlaceholderText('搜索用户名 / 昵称 / 用户 ID'),
      'alice',
    );
    await user.click(screen.getByRole('button', { name: '搜索' }));

    expect(onSearch).toHaveBeenCalledWith('alice');
  });

  it('选中行存在时允许打开批量操作', async () => {
    const user = userEvent.setup();
    const onOpenBatch = vi.fn();

    render(
      <UserToolbar
        keyword={''}
        advancedOpen={true}
        selectedCount={2}
        onKeywordChange={vi.fn()}
        onSearch={vi.fn()}
        onToggleAdvanced={vi.fn()}
        onOpenCreate={vi.fn()}
        onOpenBatch={onOpenBatch}
      />,
    );

    await user.click(screen.getByRole('button', { name: '批量操作' }));
    expect(onOpenBatch).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd admin-rsbuild && pnpm vitest run src/routes/system/user/__tests__/UserToolbar.test.tsx`

Expected: FAIL，提示 `#UserToolbar` 不存在。

- [ ] **Step 3: 实现工具栏、筛选面板与私有样式**

```tsx
import styled from 'styled-components';

export const PageShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const HeaderCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

export const FilterCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
```

```tsx
import React from 'react';
import { Button, Input, Space, Typography } from 'antd';

interface UserToolbarProps {
  keyword: string;
  advancedOpen: boolean;
  selectedCount: number;
  onKeywordChange: (value: string) => void;
  onSearch: (value: string) => void;
  onToggleAdvanced: () => void;
  onOpenCreate: () => void;
  onOpenBatch: () => void;
}

const UserToolbar = ({
  keyword,
  advancedOpen,
  selectedCount,
  onKeywordChange,
  onSearch,
  onToggleAdvanced,
  onOpenCreate,
  onOpenBatch,
}: UserToolbarProps) => {
  let advancedButtonText = '高级筛选';
  if (advancedOpen) {
    advancedButtonText = '收起高级筛选';
  }

  return (
    <Space direction={'vertical'} size={12} style={{ width: '100%' }}>
      <Space
        style={{ width: '100%', justifyContent: 'space-between' }}
        align={'start'}
      >
        <Space direction={'vertical'} size={2}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            用户管理
          </Typography.Title>
          <Typography.Text type={'secondary'}>
            管理账号、角色归属与职位绑定关系
          </Typography.Text>
        </Space>

        <Space>
          <Button onClick={onOpenBatch} disabled={selectedCount === 0}>
            批量操作
          </Button>
          <Button type={'primary'} onClick={onOpenCreate}>
            新增用户
          </Button>
        </Space>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Input.Search
          value={keyword}
          allowClear
          placeholder={'搜索用户名 / 昵称 / 用户 ID'}
          style={{ width: 320 }}
          enterButton={'搜索'}
          onChange={(event) => {
            onKeywordChange(event.target.value);
          }}
          onSearch={onSearch}
        />

        <Button onClick={onToggleAdvanced}>{advancedButtonText}</Button>
      </Space>
    </Space>
  );
};

export default UserToolbar;
```

```tsx
import React from 'react';
import { Button, Form, Input, InputNumber, Select, Space } from 'antd';

import type { UserFilterValues } from './#userQueryHelper';

interface UserAdvancedFilterProps {
  open: boolean;
  value: UserFilterValues;
  onChange: (value: UserFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
}

const UserAdvancedFilter = ({
  open,
  value,
  onChange,
  onApply,
  onReset,
}: UserAdvancedFilterProps) => {
  if (!open) {
    return null;
  }

  return (
    <Form layout={'vertical'}>
      <Space align={'start'} wrap>
        <Form.Item label={'用户名'}>
          <Input
            value={value.username}
            onChange={(event) => {
              onChange({ ...value, username: event.target.value });
            }}
            placeholder={'按用户名筛选'}
          />
        </Form.Item>

        <Form.Item label={'昵称'}>
          <Input
            value={value.nickname}
            onChange={(event) => {
              onChange({ ...value, nickname: event.target.value });
            }}
            placeholder={'按昵称筛选'}
          />
        </Form.Item>

        <Form.Item label={'用户 ID'}>
          <InputNumber
            min={1}
            precision={0}
            value={value.userId}
            onChange={(nextValue) => {
              if (typeof nextValue === 'number') {
                onChange({ ...value, userId: nextValue });
                return;
              }
              onChange({ ...value, userId: undefined });
            }}
            placeholder={'按用户 ID'}
          />
        </Form.Item>

        <Form.Item label={'状态'}>
          <Select
            value={value.isDisable}
            placeholder={'全部状态'}
            allowClear
            style={{ width: 140 }}
            onChange={(nextValue) => {
              onChange({ ...value, isDisable: nextValue });
            }}
            options={[
              { label: '启用', value: false },
              { label: '禁用', value: true },
            ]}
          />
        </Form.Item>
      </Space>

      <Space>
        <Button type={'primary'} onClick={onApply}>
          应用筛选
        </Button>
        <Button onClick={onReset}>重置</Button>
      </Space>
    </Form>
  );
};

export default UserAdvancedFilter;
```

- [ ] **Step 4: 重新运行工具栏测试**

Run: `cd admin-rsbuild && pnpm vitest run src/routes/system/user/__tests__/UserToolbar.test.tsx`

Expected: PASS，`UserToolbar.test.tsx` 通过。

- [ ] **Step 5: 提交这一小步**

```bash
git add admin-rsbuild/src/routes/system/user/#user.styled.tsx \
  admin-rsbuild/src/routes/system/user/#UserToolbar.tsx \
  admin-rsbuild/src/routes/system/user/#UserAdvancedFilter.tsx \
  admin-rsbuild/src/routes/system/user/__tests__/UserToolbar.test.tsx
git commit -m "feat(user-ui): 拆分用户列表工具栏与高级筛选"
```

### Task 6: 重构用户表格、操作菜单与表单排版

**Files:**
- Create: `admin-rsbuild/src/routes/system/user/#UserInfoCell.tsx`
- Create: `admin-rsbuild/src/routes/system/user/#UserActionMenu.tsx`
- Modify: `admin-rsbuild/src/routes/system/user/#UserTable.tsx`
- Modify: `admin-rsbuild/src/routes/system/user/#CreateUserForm.tsx`
- Modify: `admin-rsbuild/src/routes/system/user/#UpdateUserForm.tsx`
- Test: `admin-rsbuild/src/routes/system/user/__tests__/UserTable.test.tsx`

- [ ] **Step 1: 先写首屏渲染失败用例**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { User } from '@/api/modules/user';

import UserInfoCell from '../#UserInfoCell';

describe('UserInfoCell', () => {
  it('应同时展示昵称、用户名和用户 ID', () => {
    const record: User = {
      id: 1024,
      nickname: '周可',
      username: 'zhouke',
      avatarId: '',
      tenantName: '总部租户',
      roleNames: ['管理员'],
      positionNames: ['产品负责人'],
      hasRole: true,
      hasPosition: true,
      lastLoginTime: '2026-04-04 10:30:00',
      updatedAt: '2026-04-04 11:00:00',
    };

    render(<UserInfoCell item={record} />);

    expect(screen.getByText('周可')).toBeDefined();
    expect(screen.getByText('zhouke')).toBeDefined();
    expect(screen.getByText('ID 1024')).toBeDefined();
  });
});
```

- [ ] **Step 2: 运行测试确认当前失败**

Run: `cd admin-rsbuild && pnpm vitest run src/routes/system/user/__tests__/UserTable.test.tsx`

Expected: FAIL，提示 `#UserInfoCell` 不存在或渲染字段不匹配。

- [ ] **Step 3: 实现账号信息单元格、更多菜单和表格重组**

```tsx
import React from 'react';
import { Avatar, Space, Tag, Typography } from 'antd';

import type { User } from '@/api/modules/user';
import useFileUrl from '@/hooks/useFileUrl';

const UserInfoCell = ({ item }: { item: User }) => {
  const avatarUrl = useFileUrl(item.avatarId);
  let avatarText = '用';
  if (item.nickname) {
    avatarText = item.nickname.slice(0, 1);
  }

  return (
    <Space align={'center'} size={12}>
      <Avatar src={avatarUrl}>{avatarText}</Avatar>
      <Space direction={'vertical'} size={0}>
        <Typography.Text strong>{item.nickname || '未命名用户'}</Typography.Text>
        <Typography.Text type={'secondary'}>{item.username}</Typography.Text>
        <Typography.Text type={'secondary'}>{`ID ${item.id}`}</Typography.Text>
      </Space>
    </Space>
  );
};

export default UserInfoCell;
```

```tsx
import React from 'react';
import { Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';

import type { User } from '@/api/modules/user';
import { KTable } from '@/components';

interface UserActionMenuProps {
  record: User;
  onEdit: () => Promise<void>;
  onBindRoles: () => Promise<void>;
  onBindPositions: () => Promise<void>;
  onToggleStatus: () => Promise<void>;
}

const UserActionMenu = ({
  record,
  onEdit,
  onBindRoles,
  onBindPositions,
  onToggleStatus,
}: UserActionMenuProps) => {
  let statusLabel = '禁用用户';
  if (record.isDisable) {
    statusLabel = '启用用户';
  }

  const items: MenuProps['items'] = [
    { key: 'roles', label: '绑定角色', onClick: onBindRoles },
    { key: 'positions', label: '绑定职位', onClick: onBindPositions },
    {
      key: 'status',
      label: statusLabel,
      onClick: onToggleStatus,
    },
  ];

  return (
    <Space>
      <KTable.Button type={'primary'} size={'small'} onClick={onEdit}>
        编辑
      </KTable.Button>
      <Dropdown menu={{ items }} trigger={['click']}>
        <KTable.Button size={'small'}>更多</KTable.Button>
      </Dropdown>
    </Space>
  );
};

export default UserActionMenu;
```

```tsx
const columns: TableColumnsType<User> = [
  {
    title: '账号信息',
    dataIndex: 'nickname',
    key: 'nickname',
    render: (_, item) => <UserInfoCell item={item} />,
  },
  {
    title: '默认租户',
    dataIndex: 'tenantName',
    key: 'tenantName',
    width: 180,
    render: (_, record) => getUserTenantText(record),
  },
  {
    title: '角色 / 职位摘要',
    key: 'summary',
    width: 260,
    render: (_, record) => {
      let roleText = '未绑定角色';
      if (record.roleNames?.length) {
        roleText = record.roleNames.slice(0, 2).join('、');
      }
      let positionText = '未绑定职位';
      if (record.positionNames?.length) {
        positionText = record.positionNames.slice(0, 2).join('、');
      }

      return (
        <Space direction={'vertical'} size={0}>
          <Typography.Text>{roleText}</Typography.Text>
          <Typography.Text type={'secondary'}>{positionText}</Typography.Text>
        </Space>
      );
    },
  },
  {
    title: '最近登录 / 更新时间',
    key: 'time',
    width: 220,
    render: (_, record) => (
      <Space direction={'vertical'} size={0}>
        <Typography.Text>{record.lastLoginTime || '暂无登录记录'}</Typography.Text>
        <Typography.Text type={'secondary'}>
          {record.updatedAt || '暂无更新时间'}
        </Typography.Text>
      </Space>
    ),
  },
];
```

- [ ] **Step 4: 优化新增与编辑表单布局并跑 UI 测试**

```tsx
<Typography.Title level={5} style={{ marginBottom: 12 }}>
  基础信息
</Typography.Title>
<Form.Item name={'nickname'} label={'昵称'} rules={[{ required: true, message: '请输入昵称' }]}>
  <Input placeholder={'请输入昵称'} autoFocus />
</Form.Item>
<Form.Item name={'username'} label={'用户名'} rules={[{ required: true, message: '请输入用户名' }]}>
  <Input placeholder={'请输入用户名'} />
</Form.Item>
<Form.Item name={'tenantId'} label={'默认租户'} rules={[{ required: true, message: '请选择默认租户' }]}>
  <Select showSearch options={tenantOptions} placeholder={'请选择默认租户'} optionFilterProp={'label'} />
</Form.Item>

<Typography.Title level={5} style={{ marginBottom: 12 }}>
  账号设置
</Typography.Title>
```

```tsx
<Typography.Title level={5} style={{ marginBottom: 12 }}>
  安全设置
</Typography.Title>
<Form.Item name={'password'} label={'密码'} extra={'留空表示不修改密码'}>
  <Input.Password placeholder={'留空则不修改'} />
</Form.Item>
<Typography.Text type={'secondary'}>
  最近登录时间：{record.lastLoginTime || '暂无登录记录'}
</Typography.Text>
```

Run: `cd admin-rsbuild && pnpm vitest run src/routes/system/user/__tests__/UserTable.test.tsx`

Expected: PASS，`UserTable.test.tsx` 通过。

- [ ] **Step 5: 跑完整回归并提交**

Run:

```bash
cd admin-rsbuild && pnpm vitest run src/routes/system/user/__tests__/userQueryHelper.test.ts src/routes/system/user/__tests__/UserToolbar.test.tsx src/routes/system/user/__tests__/UserTable.test.tsx
cd ../modelDesign && mvn -pl mod-auth/mod-auth-biz -am -Dtest=UserListQueryContextFactoryTest,UserListViewAssemblerTest,UserControllerListContractTest test
```

Expected:

- 前端 Vitest 3 个测试文件全部 PASS
- 后端 Maven 3 个测试类全部 PASS

Commit:

```bash
git add admin-rsbuild/src/routes/system/user/#UserInfoCell.tsx \
  admin-rsbuild/src/routes/system/user/#UserActionMenu.tsx \
  admin-rsbuild/src/routes/system/user/#UserTable.tsx \
  admin-rsbuild/src/routes/system/user/#CreateUserForm.tsx \
  admin-rsbuild/src/routes/system/user/#UpdateUserForm.tsx \
  admin-rsbuild/src/routes/system/user/__tests__/UserTable.test.tsx
git commit -m "feat(user-ui): 重构用户列表与表单体验"
```

## Self-Review

### Spec coverage

- 统一搜索与高级筛选：Task 1、Task 3、Task 4
- 列表返回字段升级：Task 2、Task 3
- 角色/职位首屏摘要：Task 2、Task 6
- 精炼专业式页面结构：Task 4、Task 6
- 新增/编辑体验优化：Task 6
- 前后端测试与回归：Task 1 至 Task 6 的测试步骤与最终回归步骤

### Placeholder scan

- 未使用未完成标记
- 每个代码步骤都给出具体代码块
- 每个测试步骤都给出明确命令和预期结果

### Type consistency

- 后端统一使用 `keyword`、`username`、`nickname`、`userId`、`tenantId`、`isDisable`、`hasRole`、`hasPosition`
- 前端 `UserPageParams` 与后端 `UserListRequest` 字段名保持一致
- 列表返回统一使用 `roleNames`、`positionNames`、`lastLoginTime`、`updatedAt`
