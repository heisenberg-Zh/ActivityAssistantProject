package com.activityassistant.security;

import com.activityassistant.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collection;

@Slf4j
public class SecurityUtils {

    private static final String ANONYMOUS_PRINCIPAL = "anonymousUser";

    private SecurityUtils() {
    }

    public static String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (isAnonymous(authentication)) {
            throw new UnauthorizedException("\u7528\u6237\u672a\u767b\u5f55");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof String principalValue && !principalValue.isBlank()) {
            return principalValue;
        }

        throw new UnauthorizedException("\u65e0\u6cd5\u83b7\u53d6\u7528\u6237\u4fe1\u606f");
    }

    public static String getCurrentUserIdOrNull() {
        try {
            return getCurrentUserId();
        } catch (UnauthorizedException e) {
            return null;
        }
    }

    public static String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (isAnonymous(authentication)) {
            throw new UnauthorizedException("\u7528\u6237\u672a\u767b\u5f55");
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        if (authorities != null && !authorities.isEmpty()) {
            String authority = authorities.iterator().next().getAuthority();
            if (authority.startsWith("ROLE_")) {
                return authority.substring(5).toLowerCase();
            }
            return authority.toLowerCase();
        }

        return "user";
    }

    public static boolean isAdmin() {
        return "admin".equalsIgnoreCase(getCurrentUserRole());
    }

    public static boolean hasPermission(String resourceOwnerId) {
        String currentUserId = getCurrentUserId();
        return isAdmin() || currentUserId.equals(resourceOwnerId);
    }

    private static boolean isAnonymous(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return true;
        }

        if (authentication instanceof AnonymousAuthenticationToken) {
            return true;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof String principalValue && ANONYMOUS_PRINCIPAL.equalsIgnoreCase(principalValue)) {
            log.debug("Detected anonymous principal: {}", principalValue);
            return true;
        }

        return false;
    }
}