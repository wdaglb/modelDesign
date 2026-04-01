package io.github.modelDesign.system.configuration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

/**
 * 系统文件配置。
 */
@Data
@Component
@Validated
@ConfigurationProperties(prefix = "model-design.system.file")
public class SystemFileProperties {
    /**
     * 本地存储目录。
     */
    @NotBlank(message = "文件存储目录不能为空")
    private String storagePath = "./storage/";

    /**
     * 缩略图配置。
     */
    @Valid
    private ThumbnailProperties thumbnail = new ThumbnailProperties();

    /**
     * 缩略图配置。
     */
    @Data
    public static class ThumbnailProperties {
        /**
         * 是否启用缩略图。
         */
        private Boolean enabled = true;

        /**
         * 缩略图宽度。
         */
        @Min(value = 1, message = "缩略图宽度必须大于 0")
        private Integer width = 200;

        /**
         * 缩略图高度。
         */
        @Min(value = 1, message = "缩略图高度必须大于 0")
        private Integer height = 200;
    }
}
