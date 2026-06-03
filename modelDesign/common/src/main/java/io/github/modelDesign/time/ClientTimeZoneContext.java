package io.github.modelDesign.time;

import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.zone.ZoneRulesException;

/**
 * 客户端时区上下文。
 *
 * <p>前端会在请求头中传递 IANA 时区 ID，例如 Asia/Shanghai。后端仍沿用
 * LocalDateTime 与 timestamp without time zone 存储，因此所有“用户当前时间”
 * 需要按本次请求的客户端时区生成，避免服务器部署时区与用户所在时区不一致时
 * 出现创建时间、更新时间或用户添加时间偏移。</p>
 */
public final class ClientTimeZoneContext {
    /**
     * 请求头名称。
     */
    public static final String HEADER_NAME = "X-Client-Time-Zone";

    /**
     * 默认时区。
     *
     * <p>缺少请求头或请求头非法时回退到系统时区，兼容任务调度、异步消费、
     * 单元测试以及旧客户端调用。</p>
     */
    private static final ZoneId DEFAULT_ZONE_ID = ZoneId.systemDefault();

    /**
     * 当前请求的客户端时区。
     */
    private static final ThreadLocal<ZoneId> HOLDER = new ThreadLocal<>();

    private ClientTimeZoneContext() {
    }

    /**
     * 从请求头设置当前客户端时区。
     *
     * @param timeZoneId IANA 时区 ID
     */
    public static void set(String timeZoneId) {
        ZoneId zoneId = parseZoneId(timeZoneId);
        if (zoneId == null) {
            HOLDER.remove();
            return;
        }

        HOLDER.set(zoneId);
    }

    /**
     * 获取当前请求时区。
     *
     * @return 当前请求时区；未设置时返回系统默认时区
     */
    public static ZoneId getZoneId() {
        ZoneId zoneId = HOLDER.get();
        if (zoneId != null) {
            return zoneId;
        }

        return DEFAULT_ZONE_ID;
    }

    /**
     * 按客户端时区获取当前本地时间。
     *
     * @return 当前请求时区下的本地时间
     */
    public static LocalDateTime now() {
        return LocalDateTime.now(getZoneId());
    }

    /**
     * 清理当前线程的客户端时区。
     */
    public static void clear() {
        HOLDER.remove();
    }

    /**
     * 解析客户端传入的时区。
     *
     * <p>不信任前端请求头，非法时区直接忽略并回退默认时区；这里不抛出异常，
     * 是为了避免时区头错误影响原有业务接口可用性。</p>
     *
     * @param timeZoneId IANA 时区 ID
     * @return 合法时区；非法或空值返回 null
     */
    private static ZoneId parseZoneId(String timeZoneId) {
        if (!StringUtils.hasText(timeZoneId)) {
            return null;
        }

        try {
            return ZoneId.of(timeZoneId.trim());
        } catch (ZoneRulesException exception) {
            return null;
        }
    }
}
