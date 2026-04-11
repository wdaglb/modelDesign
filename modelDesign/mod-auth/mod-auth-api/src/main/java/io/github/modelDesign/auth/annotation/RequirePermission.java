package io.github.modelDesign.auth.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 声明接口所需权限。
 *
 * 当前实现默认按菜单资源类型校验，
 * 并支持通过 anyOf 处理“一个接口被多个按钮入口复用”的场景。
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    /**
     * 默认资源类型。
     */
    String type() default "menu";

    /**
     * 单个必需资源。
     */
    String value() default "";

    /**
     * 任意满足其一即可放行的资源集合。
     */
    String[] anyOf() default {};
}
