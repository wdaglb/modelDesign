package io.github.modelDesign.auth.session;

import io.github.modelDesign.auth.configuration.AuthProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * JWT 令牌服务。
 */
@Component
@RequiredArgsConstructor
public class TokenService {
    /**
     * Access token 类型。
     */
    public static final String ACCESS_TOKEN_TYPE = "ACCESS";

    /**
     * Refresh token 类型。
     */
    public static final String REFRESH_TOKEN_TYPE = "REFRESH";

    /**
     * MCP token 类型。
     */
    public static final String MCP_TOKEN_TYPE = "MCP";

    private final AuthProperties authProperties;

    /**
     * 生成 access token。
     *
     * @param currentAdmin 当前登录管理员
     * @return JWT 令牌
     */
    public String createAccessToken(CurrentAdmin currentAdmin) {
        return createToken(
                currentAdmin,
                authProperties.getAccessTokenExpireSeconds(),
                ACCESS_TOKEN_TYPE,
                null
        );
    }

    /**
     * 生成 refresh token。
     *
     * @param currentAdmin    当前登录管理员
     * @param refreshTokenId refresh token 标识
     * @return JWT 令牌
     */
    public String createRefreshToken(CurrentAdmin currentAdmin,
                                     String refreshTokenId) {
        return createToken(
                currentAdmin,
                authProperties.getRefreshTokenExpireSeconds(),
                REFRESH_TOKEN_TYPE,
                refreshTokenId
        );
    }

    /**
     * 生成 MCP token。
     *
     * @param currentAdmin 当前登录管理员
     * @return MCP token
     */
    public String createMcpToken(CurrentAdmin currentAdmin) {
        return createToken(
                currentAdmin,
                authProperties.getMcpTokenExpireSeconds(),
                MCP_TOKEN_TYPE,
                null
        );
    }

    /**
     * 解析 JWT 声明。
     *
     * @param token JWT 令牌
     * @return JWT 声明
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 解析 access token 声明。
     *
     * @param token access token
     * @return JWT 声明
     */
    public Claims parseAccessClaims(String token) {
        Claims claims = parseClaims(token);
        validateTokenType(claims, ACCESS_TOKEN_TYPE);
        return claims;
    }

    /**
     * 解析 refresh token 声明。
     *
     * @param token refresh token
     * @return JWT 声明
     */
    public Claims parseRefreshClaims(String token) {
        Claims claims = parseClaims(token);
        validateTokenType(claims, REFRESH_TOKEN_TYPE);
        return claims;
    }

    /**
     * 解析 MCP token 声明。
     *
     * @param token MCP token
     * @return JWT 声明
     */
    public Claims parseMcpClaims(String token) {
        Claims claims = parseClaims(token);
        validateTokenType(claims, MCP_TOKEN_TYPE);
        return claims;
    }

    /**
     * 获取 access token 过期时间戳。
     *
     * @return 过期时间戳，单位毫秒
     */
    public long getAccessExpireTime() {
        return System.currentTimeMillis()
                + authProperties.getAccessTokenExpireSeconds() * 1000;
    }

    /**
     * 获取 refresh token 过期时间戳。
     *
     * @return 过期时间戳，单位毫秒
     */
    public long getRefreshExpireTime() {
        return System.currentTimeMillis()
                + authProperties.getRefreshTokenExpireSeconds() * 1000;
    }

    /**
     * 获取 MCP token 过期时间戳。
     *
     * @return 过期时间戳，单位毫秒
     */
    public long getMcpExpireTime() {
        return System.currentTimeMillis()
                + authProperties.getMcpTokenExpireSeconds() * 1000;
    }

    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(
                authProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * 统一生成令牌，避免 access 与 refresh 的公共声明发生偏差。
     *
     * @param currentAdmin    当前登录管理员
     * @param expireSeconds   有效期秒数
     * @param tokenType       令牌类型
     * @param refreshTokenId refresh token 标识
     * @return JWT 令牌
     */
    private String createToken(CurrentAdmin currentAdmin,
                               long expireSeconds,
                               String tokenType,
                               String refreshTokenId) {
        Instant now = Instant.now();
        Instant expireAt = now.plusSeconds(expireSeconds);
        var builder = Jwts.builder()
                .subject(String.valueOf(currentAdmin.getUserId()))
                .claim("loginId", currentAdmin.getLoginId())
                .claim("tenantId", currentAdmin.getTenantId())
                .claim("username", currentAdmin.getUsername())
                .claim("nickname", currentAdmin.getNickname())
                .claim("avatarId", currentAdmin.getAvatarId())
                .claim("gitUsername", currentAdmin.getGitUsername())
                .claim("loginIp", currentAdmin.getLoginIp())
                .claim("tokenType", tokenType)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expireAt))
                .signWith(getSecretKey());
        if (refreshTokenId != null && !refreshTokenId.isBlank()) {
            builder.claim("refreshTokenId", refreshTokenId);
        }
        return builder.compact();
    }

    /**
     * 校验令牌类型，避免 access token 与 refresh token 被混用。
     *
     * @param claims            JWT 声明
     * @param expectedTokenType 期望类型
     */
    private void validateTokenType(Claims claims,
                                   String expectedTokenType) {
        String actualTokenType = claims.get("tokenType", String.class);
        if (!expectedTokenType.equals(actualTokenType)) {
            throw new IllegalArgumentException("令牌类型不匹配");
        }
    }
}
