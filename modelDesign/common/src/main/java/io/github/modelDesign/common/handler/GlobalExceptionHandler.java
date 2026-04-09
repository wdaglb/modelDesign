package io.github.modelDesign.common.handler;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.common.exception.UnauthorizedException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Locale;
import java.util.Map;

/**
 * 全局异常处理。
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    /**
     * 处理参数校验异常。
     *
     * @param exception 参数校验异常
     * @return 错误响应
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class, ConstraintViolationException.class})
    public ResponseEntity<Map<String, Object>> handleValidationException(Exception exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", resolveValidationMessage(exception)));
    }

    /**
     * 处理未授权异常。
     *
     * @param exception 未授权异常
     * @return 错误响应
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorizedException(UnauthorizedException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", exception.getMessage()));
    }

    /**
     * 处理业务异常。
     *
     * @param exception 业务异常
     * @return 错误响应
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessException(BusinessException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(Map.of("message", exception.getMessage()));
    }

    /**
     * 处理上传文件大小超限异常。
     *
     * @param exception 上传文件大小超限异常
     * @return 错误响应
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException exception) {
        return buildPayloadTooLargeResponse();
    }

    /**
     * 处理不支持的请求内容类型异常。
     *
     * @param exception 不支持的请求内容类型异常
     * @return 错误响应
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(Map.of("message", resolveMediaTypeNotSupportedMessage(exception)));
    }

    /**
     * 处理静态资源未找到异常。
     *
     * @param exception 静态资源未找到异常
     * @return 错误响应
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFoundException(NoResourceFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "请求的资源不存在"));
    }

    /**
     * 处理请求路径未找到异常。
     *
     * @param exception 请求路径未找到异常
     * @return 错误响应
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandlerFoundException(NoHandlerFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "请求的资源不存在"));
    }

    /**
     * 处理兜底异常。
     *
     * @param exception 未知异常
     * @return 错误响应
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception exception) {
        if (isUploadSizeExceededException(exception)) {
            return buildPayloadTooLargeResponse();
        }
        log.error("服务器内部错误", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "服务器内部错误，请稍后重试"));
    }

    private String resolveValidationMessage(Exception exception) {
        if (exception instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException methodArgumentNotValidException =
                    (MethodArgumentNotValidException) exception;
            if (methodArgumentNotValidException.getBindingResult().getFieldError() != null) {
                return methodArgumentNotValidException.getBindingResult()
                        .getFieldError().getDefaultMessage();
            }
        }
        if (exception instanceof BindException) {
            BindException bindException = (BindException) exception;
            if (bindException.getBindingResult().getFieldError() != null) {
                return bindException.getBindingResult().getFieldError()
                        .getDefaultMessage();
            }
        }
        if (exception instanceof ConstraintViolationException) {
            ConstraintViolationException constraintViolationException =
                    (ConstraintViolationException) exception;
            if (!constraintViolationException.getConstraintViolations().isEmpty()) {
                return constraintViolationException.getConstraintViolations()
                        .iterator().next().getMessage();
            }
        }
        return "请求参数错误";
    }

    private String resolveMediaTypeNotSupportedMessage(HttpMediaTypeNotSupportedException exception) {
        for (MediaType supportedMediaType : exception.getSupportedMediaTypes()) {
            if (supportedMediaType != null && supportedMediaType.equalsTypeAndSubtype(MediaType.MULTIPART_FORM_DATA)) {
                return "当前接口仅支持 multipart/form-data 上传";
            }
        }
        return "请求内容类型不支持";
    }

    private boolean isUploadSizeExceededException(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof MaxUploadSizeExceededException) {
                return true;
            }
            String simpleName = current.getClass().getSimpleName();
            if ("FileSizeLimitExceededException".equals(simpleName) || "SizeLimitExceededException".equals(simpleName)) {
                return true;
            }
            String message = current.getMessage();
            if (message != null) {
                String normalizedMessage = message.toLowerCase(Locale.ROOT);
                if (normalizedMessage.contains("maximum permitted size")
                        || normalizedMessage.contains("size limit exceeded")
                        || normalizedMessage.contains("exceeds its maximum permitted size")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }

    private ResponseEntity<Map<String, Object>> buildPayloadTooLargeResponse() {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("message", "上传文件大小超出限制"));
    }
}
