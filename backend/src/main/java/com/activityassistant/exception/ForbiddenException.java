package com.activityassistant.exception;

/**
 * 无权限异常（403）
 *
 * <p>当用户无权访问资源时抛出此异常。
 *
 * <p>使用示例：
 * <pre>{@code
 * if (!activity.getOrganizerId().equals(currentUserId)) {
 *     throw new ForbiddenException("无权限编辑此活动");
 * }
 * }</pre>
 *
 * @author Claude
 * @since 2025-01-08
 */
public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super(403, message);
    }

    public ForbiddenException() {
        super(403, "无权限访问");
    }
}
