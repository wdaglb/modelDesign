package io.github.modelDesign.system.service.systemMessage;

import io.github.modelDesign.common.exception.BusinessException;
import io.github.modelDesign.system.api.SystemMessagePushAdapter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 系统消息推送适配器注册表。
 */
@Component
public class SystemMessagePushAdapterRegistry {
    /**
     * 适配器映射。
     */
    private final Map<String, SystemMessagePushAdapter> adapterMap = new LinkedHashMap<>();

    public SystemMessagePushAdapterRegistry(List<SystemMessagePushAdapter> adapters) {
        for (SystemMessagePushAdapter adapter : adapters) {
            String adapterCode = normalizeBeanAdapterCode(adapter.getAdapterCode());
            if (adapterMap.containsKey(adapterCode)) {
                throw new IllegalStateException("系统消息推送适配器编码重复：" + adapterCode);
            }
            adapterMap.put(adapterCode, adapter);
        }
    }

    /**
     * 规范化适配器编码集合。
     *
     * @param adapterCodes 原始适配器编码集合
     * @return 规范化后的适配器编码集合
     */
    public List<String> normalizeAdapterCodes(Collection<String> adapterCodes) {
        if (adapterCodes == null || adapterCodes.isEmpty()) {
            return Collections.emptyList();
        }
        Set<String> normalizedCodes = new LinkedHashSet<>();
        for (String adapterCode : adapterCodes) {
            normalizedCodes.add(normalizeRequestAdapterCode(adapterCode));
        }
        return new ArrayList<>(normalizedCodes);
    }

    /**
     * 校验适配器编码集合。
     *
     * @param adapterCodes 适配器编码集合
     */
    public void validateAdapterCodes(Collection<String> adapterCodes) {
        List<String> normalizedCodes = normalizeAdapterCodes(adapterCodes);
        for (String adapterCode : normalizedCodes) {
            requireAdapter(adapterCode);
        }
    }

    /**
     * 获取指定适配器。
     *
     * @param adapterCode 适配器编码
     * @return 适配器
     */
    public SystemMessagePushAdapter requireAdapter(String adapterCode) {
        String normalizedAdapterCode = normalizeRequestAdapterCode(adapterCode);
        SystemMessagePushAdapter adapter = adapterMap.get(normalizedAdapterCode);
        if (adapter == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "系统消息推送适配器不存在：" + normalizedAdapterCode);
        }
        return adapter;
    }

    private String normalizeBeanAdapterCode(String adapterCode) {
        if (!StringUtils.hasText(adapterCode)) {
            throw new IllegalStateException("系统消息推送适配器编码不能为空");
        }
        return adapterCode.trim();
    }

    private String normalizeRequestAdapterCode(String adapterCode) {
        if (!StringUtils.hasText(adapterCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST.value(), "系统消息推送适配器编码不能为空");
        }
        return adapterCode.trim();
    }
}
