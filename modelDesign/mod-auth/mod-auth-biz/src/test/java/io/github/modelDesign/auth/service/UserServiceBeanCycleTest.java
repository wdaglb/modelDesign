package io.github.modelDesign.auth.service;

import io.github.modelDesign.auth.mapper.UserMapper;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * 用户相关服务循环依赖约束测试。
 */
class UserServiceBeanCycleTest {
    /**
     * 用户职位关系服务不应再反向依赖用户服务，否则会重新形成循环依赖。
     */
    @Test
    void userPositionServiceShouldNotDependOnUserService() {
        Constructor<?>[] constructors = UserPositionService.class.getDeclaredConstructors();
        Constructor<?> targetConstructor = constructors[0];
        List<Class<?>> parameterTypes = Arrays.asList(
                targetConstructor.getParameterTypes()
        );

        assertFalse(
                parameterTypes.contains(UserService.class),
                "UserPositionService 不应直接依赖 UserService"
        );
        assertFalse(
                parameterTypes.isEmpty(),
                "UserPositionService 应显式声明最小依赖"
        );
        assertFalse(
                !parameterTypes.contains(UserMapper.class),
                "UserPositionService 应改为直接依赖 UserMapper 查询用户"
        );
    }
}
