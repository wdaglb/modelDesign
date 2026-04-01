package io.github.modelDesign.project.request;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

/**
 * 将未分配负责人值反序列化为 {@code null} 的 Long 反序列化器。
 */
public class AssigneeIdDeserializer extends JsonDeserializer<Long> {
    /**
     * 反序列化 Long 值。
     *
     * @param parser Jackson 解析器
     * @param context 反序列化上下文
     * @return Long 值；当输入为空字符串或 0 时返回 {@code null}
     * @throws IOException 读取异常
     */
    @Override
    public Long deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        JsonToken currentToken = parser.currentToken();
        if (currentToken == JsonToken.VALUE_NULL) {
            return null;
        }
        if (currentToken == JsonToken.VALUE_NUMBER_INT) {
            long value = parser.getLongValue();
            if (value == 0L) {
                return null;
            }
            return value;
        }
        if (currentToken == JsonToken.VALUE_STRING) {
            String value = parser.getText();
            if (value == null) {
                return null;
            }
            String trimmedValue = value.trim();
            if (trimmedValue.isEmpty()) {
                return null;
            }
            if ("0".equals(trimmedValue)) {
                return null;
            }
            return Long.valueOf(trimmedValue);
        }
        return (Long) context.handleUnexpectedToken(Long.class, parser);
    }
}
