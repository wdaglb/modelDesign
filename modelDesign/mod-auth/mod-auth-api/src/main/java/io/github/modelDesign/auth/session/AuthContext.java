package io.github.modelDesign.auth.session;

/**
 * 当前请求登录上下文。
 */
public final class AuthContext {
    private static final ThreadLocal<CurrentAdmin> HOLDER = new ThreadLocal<>();

    private AuthContext() {
    }

    /**
     * 设置当前登录管理员。
     *
     * @param currentAdmin 当前登录管理员
     */
    public static void set(CurrentAdmin currentAdmin) {
        HOLDER.set(currentAdmin);
    }

    /**
     * 获取当前登录管理员。
     *
     * @return 当前登录管理员
     */
    public static CurrentAdmin get() {
        return HOLDER.get();
    }

    /**
     * 清理当前请求上下文。
     */
    public static void clear() {
        HOLDER.remove();
    }
}
