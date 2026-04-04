package io.github.modelDesign.thirdparty.oauth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 通用第三方账号绑定关系。
 */
@Data
@TableName("userOauth")
@EqualsAndHashCode(callSuper = true)
public class UserOauth extends BaseEntity {
    private Long tenantId;
    private Long userId;
    private String provider;
    private String providerAppId;
    private String providerUserId;
    private String providerUnionId;
    private String providerOpenId;
    private String nickname;
    private String avatar;
    private String extraJson;
    private String bindSource;
    private String status;
    private LocalDateTime boundAt;
    private LocalDateTime lastAuthAt;
}
