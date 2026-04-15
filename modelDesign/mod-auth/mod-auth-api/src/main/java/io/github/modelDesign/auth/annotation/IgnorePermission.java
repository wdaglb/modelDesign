package io.github.modelDesign.auth.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标记无需生成权限资源目录的控制器或接口。
 *
 * 设计意图：
 * 1. 资源目录改为从 Spring 映射自动扫描后，仍允许显式排除登录态、个人中心等公共接口。
 * 2. 该注解仅影响“资源目录生成”，不改变运行时鉴权链路。
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface IgnorePermission {
}
