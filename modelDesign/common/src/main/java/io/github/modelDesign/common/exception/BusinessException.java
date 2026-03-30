package io.github.modelDesign.common.exception;

/**
 * 通用业务异常。
 */
public class BusinessException extends RuntimeException {
    /**
     * HTTP 状态码。
     */
    private final int status;

    /**
     * 创建业务异常。
     *
     * @param status  HTTP 状态码
     * @param message 错误消息
     */
    public BusinessException(int status, String message) {
        super(message);
        this.status = status;
    }

    /**
     * 获取 HTTP 状态码。
     *
     * @return HTTP 状态码
     */
    public int getStatus() {
        return status;
    }
}
