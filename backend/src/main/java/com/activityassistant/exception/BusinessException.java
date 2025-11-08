package com.activityassistant.exception;

import lombok.Getter;

/**
 * 业务异常基类
 *
 * <p>所有业务逻辑异常统一继承此类，通过错误码和消息传递错误信息。
 *
 * <p>使用示例：
 * <pre>{@code
 * if (activity == null) {
 *     throw new BusinessException(404, "活动不存在");
 * }
 *
 * if (activity.getJoined() >= activity.getTotal()) {
 *     throw new BusinessException(2002, "活动已满员");
 * }
 * }</pre>
 *
 * @author Claude
 * @since 2025-01-08
 */
@Getter
public class BusinessException extends RuntimeException {

    /**
     * 错误码
     */
    private final Integer code;

    /**
     * 错误消息
     */
    private final String message;

    /**
     * 附加数据（可选）
     */
    private Object data;

    /**
     * 构造函数（仅错误码和消息）
     */
    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }

    /**
     * 构造函数（错误码、消息和附加数据）
     */
    public BusinessException(Integer code, String message, Object data) {
        super(message);
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 构造函数（错误码、消息和原始异常）
     */
    public BusinessException(Integer code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.message = message;
    }
}
