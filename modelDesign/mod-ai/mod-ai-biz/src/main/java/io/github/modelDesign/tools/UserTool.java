package io.github.modelDesign.tools;

import org.springframework.ai.chat.model.ToolContext;

import java.util.Map;
import java.util.function.BiFunction;

public class UserTool implements BiFunction<Map<String, Object>, ToolContext, String> {
    @Override
    public String apply(Map<String, Object> map, ToolContext toolContext) {
        return "搜索结果：id为" + map.get("id") + "的学生名字为：唐僧";
    }
}
