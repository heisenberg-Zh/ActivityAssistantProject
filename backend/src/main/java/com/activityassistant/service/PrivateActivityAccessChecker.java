package com.activityassistant.service;

import com.activityassistant.exception.BusinessException;
import com.activityassistant.model.Activity;
import com.activityassistant.security.SystemAdminAccessChecker;
import com.activityassistant.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

import static com.activityassistant.constant.ErrorCode.ACTIVITY_REGISTRATION_CLOSED;
import static com.activityassistant.constant.ErrorCode.PERMISSION_DENIED;

/**
 * 私密活动访问校验（前后端一致的“凭分享可访问”规则）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PrivateActivityAccessChecker {

    private static final List<String> RELATED_REGISTRATION_STATUSES = List.of("approved", "pending");

    private final RegistrationRepository registrationRepository;
    private final SystemAdminAccessChecker systemAdminAccessChecker;

    public boolean isRelatedUser(Activity activity, String userId) {
        if (activity == null || userId == null) {
            return false;
        }

        // 系统管理员：可视为“相关”
        if (systemAdminAccessChecker.isSystemAdmin(userId)) {
            return true;
        }

        // 1) 组织者
        if (userId.equals(activity.getOrganizerId())) {
            return true;
        }

        // 2) 管理员（JSON字符串包含）
        if (activity.getAdministrators() != null && activity.getAdministrators().contains("\"" + userId + "\"")) {
            return true;
        }

        // 3) 已报名用户（pending/approved）
        return registrationRepository.existsByActivityIdAndUserIdAndStatusIn(
                activity.getId(), userId, RELATED_REGISTRATION_STATUSES
        );
    }

    /**
     * 校验私密活动是否可访问：
     * - 未登录：必须拦截
     * - 相关人：直接放行
     * - 非相关人：仅允许携带有效 shareToken 的分享访问；且 shareToken 有效期到报名截止时间（兜底活动开始时间）
     */
    public void checkCanView(Activity activity, String userId, String shareToken, boolean fromShare) {
        if (userId == null) {
            throw new BusinessException(PERMISSION_DENIED, "请先登录后查看该活动");
        }

        // 系统管理员：允许访问所有活动详情（含私密）
        if (systemAdminAccessChecker.isSystemAdmin(userId)) {
            return;
        }

        if (isRelatedUser(activity, userId)) {
            return;
        }

        // 报名截止后：对非相关人不再开放详情（按产品要求直接提示即可）
        LocalDateTime expiresAt = activity.getRegisterDeadline() != null
                ? activity.getRegisterDeadline()
                : activity.getStartTime();
        if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) {
            throw new BusinessException(
                    ACTIVITY_REGISTRATION_CLOSED,
                    "该活动报名已截止。已报名用户请前往「我的活动」查看该活动。谢谢理解。"
            );
        }

        if (shareToken == null || shareToken.trim().isEmpty()) {
            if (fromShare) {
                throw new BusinessException(PERMISSION_DENIED, "分享链接已失效，请让组织者重新分享");
            }
            throw new BusinessException(PERMISSION_DENIED, "无权访问此私密活动");
        }

        if (activity.getShareToken() == null || !shareToken.equals(activity.getShareToken())) {
            if (fromShare) {
                throw new BusinessException(PERMISSION_DENIED, "分享链接无效，请让组织者重新分享");
            }
            throw new BusinessException(PERMISSION_DENIED, "无权访问此私密活动");
        }
    }
}
