package io.github.modelDesign.project.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.io.IOException;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Collections;
import java.util.List;

/**
 * 任务变更日志内容 JSONB 类型处理器。
 */
public class ProjectTaskChangeLogContentTypeHandler extends BaseTypeHandler<List<ProjectTaskChangeContentItem>> {
    /**
     * Jackson 对象映射器。
     */
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /**
     * 内容项类型引用。
     */
    private static final TypeReference<List<ProjectTaskChangeContentItem>> TYPE_REFERENCE =
            new TypeReference<>() {
            };

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<ProjectTaskChangeContentItem> parameter, JdbcType jdbcType)
            throws SQLException {
        try {
            ps.setObject(i, OBJECT_MAPPER.writeValueAsString(parameter), Types.OTHER);
        } catch (JsonProcessingException exception) {
            throw new SQLException("序列化任务变更日志内容失败", exception);
        }
    }

    @Override
    public List<ProjectTaskChangeContentItem> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parse(rs.getString(columnName));
    }

    @Override
    public List<ProjectTaskChangeContentItem> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parse(rs.getString(columnIndex));
    }

    @Override
    public List<ProjectTaskChangeContentItem> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parse(cs.getString(columnIndex));
    }

    private List<ProjectTaskChangeContentItem> parse(String value) throws SQLException {
        if (value == null || value.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(value, TYPE_REFERENCE);
        } catch (IOException exception) {
            throw new SQLException("反序列化任务变更日志内容失败", exception);
        }
    }
}
