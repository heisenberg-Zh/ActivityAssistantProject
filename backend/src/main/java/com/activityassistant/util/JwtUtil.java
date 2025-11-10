package com.activityassistant.util;

import com.activityassistant.constant.AppConstants;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT 工具类
 *
 * <p>用于生成和解析 JWT Token，实现用户认证。
 *
 * @author Claude
 * @since 2025-01-08
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration}")
    private Long expiration;

    /**
     * 生成 JWT Token
     *
     * @param userId 用户ID
     * @param role   用户角色
     * @return JWT Token
     */
    public String generateToken(String userId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(AppConstants.JWT_CLAIM_USER_ID, userId);
        claims.put(AppConstants.JWT_CLAIM_ROLE, role);

        return generateToken(claims, userId);
    }

    /**
     * 生成 JWT Token（携带自定义声明）
     *
     * @param claims  自定义声明
     * @param subject 主题（通常是用户ID）
     * @return JWT Token
     */
    public String generateToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + expiration);

        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(key)
                .compact();
    }

    /**
     * 从 Token 中提取用户ID
     *
     * @param token JWT Token
     * @return 用户ID
     */
    public String getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get(AppConstants.JWT_CLAIM_USER_ID, String.class);
    }

    /**
     * 从 Token 中提取用户角色
     *
     * @param token JWT Token
     * @return 用户角色
     */
    public String getRoleFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get(AppConstants.JWT_CLAIM_ROLE, String.class);
    }

    /**
     * 从 Token 中提取主题（用户ID）
     *
     * @param token JWT Token
     * @return 主题
     */
    public String getSubjectFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getSubject();
    }

    /**
     * 从 Token 中提取过期时间
     *
     * @param token JWT Token
     * @return 过期时间
     */
    public Date getExpirationFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.getExpiration();
    }

    /**
     * 解析 JWT Token
     *
     * @param token JWT Token
     * @return Claims
     */
    public Claims parseToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 验证 Token 是否有效（仅验证格式和有效期）
     *
     * @param token JWT Token
     * @return 是否有效
     */
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return !isTokenExpired(token);
        } catch (Exception e) {
            log.warn("Token验证失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 验证 Token 是否有效（验证格式、有效期和用户ID）
     *
     * @param token  JWT Token
     * @param userId 用户ID
     * @return 是否有效
     */
    public boolean validateToken(String token, String userId) {
        try {
            String tokenUserId = getUserIdFromToken(token);
            return tokenUserId.equals(userId) && !isTokenExpired(token);
        } catch (Exception e) {
            log.warn("Token验证失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 检查 Token 是否过期
     *
     * @param token JWT Token
     * @return 是否过期
     */
    public boolean isTokenExpired(String token) {
        Date expiration = getExpirationFromToken(token);
        return expiration.before(new Date());
    }

    /**
     * 从请求头中提取 Token
     *
     * @param bearerToken 请求头中的 Authorization 值
     * @return 纯净的 Token（去除 Bearer 前缀）
     */
    public String extractToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith(AppConstants.JWT_PREFIX)) {
            return bearerToken.substring(AppConstants.JWT_PREFIX.length());
        }
        return null;
    }
}
