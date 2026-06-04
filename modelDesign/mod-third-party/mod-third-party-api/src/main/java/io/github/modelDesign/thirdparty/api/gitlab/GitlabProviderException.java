package io.github.modelDesign.thirdparty.api.gitlab;

/**
 * GitLab provider 调用异常。
 */
public class GitlabProviderException extends RuntimeException {
    /**
     * 创建 GitLab provider 调用异常。
     *
     * @param message 错误消息
     */
    public GitlabProviderException(String message) {
        super(message);
    }

    /**
     * 创建 GitLab provider 调用异常。
     *
     * @param message 错误消息
     * @param cause   原始异常
     */
    public GitlabProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
