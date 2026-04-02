package io.github.modelDesign.auth.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import io.github.modelDesign.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户职位关系。
 */
@Data
@TableName("userPosition")
@EqualsAndHashCode(callSuper = true)
public class UserPosition extends BaseEntity {
    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 职位 ID。
     */
    private Long positionId;
}
