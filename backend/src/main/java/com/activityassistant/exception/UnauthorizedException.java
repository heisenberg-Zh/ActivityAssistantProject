package com.activityassistant.exception;

/**
 * 未认证异常（401）
 *
 * <p>当用户未登录或 Token 无效时抛出此异常。
 *
 * @author Claude
 * @since 2025-01-08
 */
public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message) {
        super(401, message);
    }

    public UnauthorizedException() {
        super(401, "未认证，请先登录");
    }
}
