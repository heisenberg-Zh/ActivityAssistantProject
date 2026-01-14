package com.activityassistant.security;

import com.activityassistant.exception.ForbiddenException;
import com.activityassistant.exception.UnauthorizedException;
import com.activityassistant.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 系统管理员权限校验（以 OpenID 白名单为准）。
 *
 * <p>白名单来自环境变量：superman（多个用英文逗号分隔）。</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SystemAdminAccessChecker {

    private final UserRepository userRepository;

    private volatile Set<String> cachedAllowedOpenids = Collections.emptySet();
    private volatile String cachedRaw = null;

    @Value("${superman:}")
    private String allowedOpenidsRaw;

    public boolean isSystemAdmin(String userId) {
        if (userId == null || userId.isBlank()) {
            return false;
        }

        String openid = userRepository.findById(userId)
                .map(u -> u.getOpenid())
                .orElse(null);
        if (openid == null || openid.isBlank()) {
            return false;
        }

        Set<String> allowlist = getAllowedOpenids();
        return allowlist.contains(openid);
    }

    public void checkIsSystemAdmin(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new UnauthorizedException("用户未登录");
        }
        if (!isSystemAdmin(userId)) {
            throw new ForbiddenException("仅系统管理员可访问");
        }
    }

    private Set<String> getAllowedOpenids() {
        String raw = allowedOpenidsRaw != null ? allowedOpenidsRaw.trim() : "";
        String previous = cachedRaw;
        if (previous != null && previous.equals(raw)) {
            return cachedAllowedOpenids;
        }

        Set<String> parsed;
        if (raw.isEmpty()) {
            parsed = Collections.emptySet();
        } else {
            parsed = Arrays.stream(raw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toCollection(HashSet::new));
        }

        cachedRaw = raw;
        cachedAllowedOpenids = parsed;
        log.info("System admin allowlist loaded: {} openid(s)", parsed.size());
        return parsed;
    }
}
