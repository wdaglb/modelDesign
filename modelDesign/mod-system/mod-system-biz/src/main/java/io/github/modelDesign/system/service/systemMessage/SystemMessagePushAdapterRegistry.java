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
     * 企业微信 provider 编码。
     *
     * <p>默认系统消息需要同步进入企业微信通道，因此在注册表中统一维护默认
     * provider 编码，避免业务发布方分散硬编码。</p>
     */
    public static final String QYWORK_PROVIDER_CODE = "qywork";

    /**
     * 默认 provider 编码集合。
     *
     * <p>默认集合只表达“需要创建哪些渠道任务”，每个 provider 的失败仍由各自
     * 独立推送任务承接，不能影响其它 provider。</p>
     */
    private static final List<String> DEFAULT_PROVIDER_CODES = List.of(QYWORK_PROVIDER_CODE);

    /**
     * 适配器映射。
     */
    private final Map<String, SystemMessagePushAdapter> adapterMap = new LinkedHashMap<>();

    /**
     * 创建系统消息推送适配器注册表。
     *
     * @param adapters Spring 注入的适配器 Bean 集合
     */
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
     * 解析最终用于创建推送任务的 provider 编码集合。
     *
     * <p>默认 provider 与调用方显式 provider 在这里统一合并并去重。这样既能让
     * 现有系统消息默认进入企业微信通道，也能避免调用方显式传入 qywork 时重复
     * 创建同一渠道任务。</p>
     *
     * @param requestedAdapterCodes 调用方显式指定的 provider 编码集合
     * @return 默认 provider 与显式 provider 合并后的编码集合
     */
    public List<String> resolvePublishAdapterCodes(Collection<String> requestedAdapterCodes) {
        Set<String> resolvedCodes = new LinkedHashSet<>(DEFAULT_PROVIDER_CODES);
        resolvedCodes.addAll(normalizeAdapterCodes(requestedAdapterCodes));
        return new ArrayList<>(resolvedCodes);
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
