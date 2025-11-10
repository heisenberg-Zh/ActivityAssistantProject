package com.activityassistant.security;

import com.activityassistant.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT认证过滤器
 * 拦截所有请求，从请求头中提取Token并验证
 *
 * @author Claude
 * @since 2025-01-08
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    /**
     * 过滤器核心逻辑
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        // 1. 从请求头获取Token
        String token = extractTokenFromRequest(request);

        // 2. 验证Token
        if (token != null && jwtUtil.validateToken(token)) {
            try {
                // 3. 从Token中提取用户信息
                String userId = jwtUtil.getUserIdFromToken(token);
                String role = jwtUtil.getRoleFromToken(token);

                log.debug("Token验证成功，userId={}, role={}", userId, role);

                // 4. 构建Spring Security认证对象
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 5. 设置到Spring Security上下文
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (Exception e) {
                log.error("Token解析失败", e);
            }
        } else if (token != null) {
            log.warn("Token验证失败或已过期");
        }

        // 6. 继续过滤链
        filterChain.doFilter(request, response);
    }

    /**
     * 从请求头中提取Token
     * 支持两种方式：
     * 1. Authorization: Bearer <token>
     * 2. X-Auth-Token: <token>
     *
     * @param request HTTP请求
     * @return Token字符串，不存在则返回null
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        // 方式1：从Authorization头提取
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        // 方式2：从X-Auth-Token头提取
        String authToken = request.getHeader("X-Auth-Token");
        if (authToken != null && !authToken.isEmpty()) {
            return authToken;
        }

        return null;
    }
}
