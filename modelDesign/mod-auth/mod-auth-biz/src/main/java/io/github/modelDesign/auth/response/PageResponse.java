package io.github.modelDesign.auth.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 分页响应。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    /**
     * 列表数据。
     */
    private List<T> items;

    /**
     * 总条数。
     */
    private Long total;
}
