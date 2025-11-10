package com.activityassistant.security;

import com.activityassistant.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collection;

/**
 * 安全工具类
 * 用于从Spring Security上下文获取当前用户信息
 *
 * @author Claude
 * @since 2025-01-08
 */
@Slf4j
public class SecurityUtils {

    /**
     * 获取当前登录用户ID
     *
     * @return 用户ID
     * @throws UnauthorizedException 未登录时抛出
     */
    public static String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("用户未登录");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof String) {
            return (String) principal;
        }

        throw new UnauthorizedException("无法获取用户信息");
    }

    /**
     * 获取当前登录用户ID（可选）
     * 如果未登录返回null而不是抛异常
     *
     * @return 用户ID，未登录返回null
     */
    public static String getCurrentUserIdOrNull() {
        try {
            return getCurrentUserId();
        } catch (UnauthorizedException e) {
            return null;
        }
    }

    /**
     * 获取当前用户角色
     *
     * @return 角色名称（如"user"、"admin"）
     */
    public static String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("用户未登录");
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        if (authorities != null && !authorities.isEmpty()) {
            String authority = authorities.iterator().next().getAuthority();
            // 去掉ROLE_前缀
            if (authority.startsWith("ROLE_")) {
                return authority.substring(5).toLowerCase();
            }
            return authority.toLowerCase();
        }

        return "user"; // 默认返回普通用户角色
    }

    /**
     * 检查当前用户是否是管理员
     *
     * @return 是否是管理员
     */
    public static boolean isAdmin() {
        return "admin".equalsIgnoreCase(getCurrentUserRole());
    }

    /**
     * 检查当前用户是否有权限访问指定资源
     *
     * @param resourceOwnerId 资源所有者ID
     * @return 是否有权限（管理员或资源所有者本人）
     */
    public static boolean hasPermission(String resourceOwnerId) {
        String currentUserId = getCurrentUserId();
        return isAdmin() || currentUserId.equals(resourceOwnerId);
    }
}
