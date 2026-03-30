package io.github.modelDesign.common.exception;

/**
 * 未登录或登录态失效异常。
 */
public class UnauthorizedException extends RuntimeException {
    /**
     * 创建未授权异常。
     *
     * @param message 错误消息
     */
    public UnauthorizedException(String message) {
        super(message);
    }
}
