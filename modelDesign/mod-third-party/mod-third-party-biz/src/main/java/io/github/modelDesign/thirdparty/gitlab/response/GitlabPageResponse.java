package io.github.modelDesign.thirdparty.gitlab.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * GitLab 分页响应。
 *
 * @param <T> 列表项类型
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GitlabPageResponse<T> {
    /**
     * 列表数据。
     */
    private List<T> items;

    /**
     * 总条数。
     */
    private Long total;
}
