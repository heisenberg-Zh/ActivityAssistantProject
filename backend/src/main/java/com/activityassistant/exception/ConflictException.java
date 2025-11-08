package com.activityassistant.exception;

/**
 * 资源冲突异常（409）
 *
 * <p>当操作导致资源冲突时抛出此异常，例如重复报名、重复提交等。
 *
 * <p>使用示例：
 * <pre>{@code
 * if (registrationRepository.existsByActivityIdAndUserId(activityId, userId)) {
 *     throw new ConflictException("您已报名，请勿重复报名");
 * }
 * }</pre>
 *
 * @author Claude
 * @since 2025-01-08
 */
public class ConflictException extends BusinessException {

    public ConflictException(String message) {
        super(409, message);
    }

    public ConflictException(String message, Object data) {
        super(409, message, data);
    }
}
