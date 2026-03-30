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
    private final AuthProperties authProperties;

    /**
     * 生成访问令牌。
     *
     * @param currentAdmin 当前登录管理员
     * @return JWT 令牌
     */
    public String createToken(CurrentAdmin currentAdmin) {
        Instant now = Instant.now();
        Instant expireAt = now.plusSeconds(authProperties.getTokenExpireSeconds());
        return Jwts.builder()
                .subject(String.valueOf(currentAdmin.getUserId()))
                .claim("loginId", currentAdmin.getLoginId())
                .claim("username", currentAdmin.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expireAt))
                .signWith(getSecretKey())
                .compact();
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
     * 获取过期时间戳。
     *
     * @return 过期时间戳，单位毫秒
     */
    public long getExpireTime() {
        return System.currentTimeMillis() + authProperties.getTokenExpireSeconds() * 1000;
    }

    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(authProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8));
    }
}
