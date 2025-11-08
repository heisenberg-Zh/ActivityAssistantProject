package com.activityassistant.exception;

/**
 * 资源不存在异常（404）
 *
 * <p>当查询的资源不存在时抛出此异常。
 *
 * <p>使用示例：
 * <pre>{@code
 * Activity activity = activityRepository.findById(id)
 *     .orElseThrow(() -> new NotFoundException("活动不存在"));
 * }</pre>
 *
 * @author Claude
 * @since 2025-01-08
 */
public class NotFoundException extends BusinessException {

    public NotFoundException(String message) {
        super(404, message);
    }

    public NotFoundException(String message, Object data) {
        super(404, message, data);
    }
}
