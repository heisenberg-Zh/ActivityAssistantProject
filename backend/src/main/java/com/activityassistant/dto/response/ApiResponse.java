package com.activityassistant.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一 API 响应格式
 *
 * <p>所有接口返回数据统一使用此格式封装，确保前后端数据交互的一致性。
 *
 * <p>示例：
 * <pre>{@code
 * // 成功响应
 * {
 *   "code": 0,
 *   "message": "success",
 *   "data": { ... }
 * }
 *
 * // 失败响应
 * {
 *   "code": 400,
 *   "message": "参数错误",
 *   "data": null
 * }
 * }</pre>
 *
 * @param <T> 响应数据类型
 * @author Claude
 * @since 2025-01-08
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)  // 空值不返回给前端
@Schema(description = "统一响应格式")
public class ApiResponse<T> {

    /**
     * 响应码
     * <p>
     * 0：成功<br>
     * 400：请求参数错误<br>
     * 401：未认证（Token 无效或过期）<br>
     * 403：无权限<br>
     * 404：资源不存在<br>
     * 409：资源冲突（如重复报名）<br>
     * 500：服务器内部错误<br>
     * 1001-9999：业务错误码
     */
    @Schema(description = "响应码（0为成功）", example = "0")
    private Integer code;

    /**
     * 响应消息
     */
    @Schema(description = "响应消息", example = "success")
    private String message;

    /**
     * 响应数据（泛型）
     */
    @Schema(description = "响应数据")
    private T data;

    /**
     * 时间戳（可选）
     */
    @Schema(description = "时间戳", example = "1704700800000")
    private Long timestamp;

    // ============================================
    // 静态工厂方法（便于快速构建响应）
    // ============================================

    /**
     * 成功响应（无数据）
     */
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(0, "success", null, System.currentTimeMillis());
    }

    /**
     * 成功响应（携带数据）
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "success", data, System.currentTimeMillis());
    }

    /**
     * 成功响应（自定义消息 + 数据）
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(0, message, data, System.currentTimeMillis());
    }

    /**
     * 失败响应（默认 400 错误码）
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(400, message, null, System.currentTimeMillis());
    }

    /**
     * 失败响应（自定义错误码和消息）
     */
    public static <T> ApiResponse<T> error(Integer code, String message) {
        return new ApiResponse<>(code, message, null, System.currentTimeMillis());
    }

    /**
     * 失败响应（自定义错误码、消息和数据）
     */
    public static <T> ApiResponse<T> error(Integer code, String message, T data) {
        return new ApiResponse<>(code, message, data, System.currentTimeMillis());
    }

    // ============================================
    // 常用业务响应
    // ============================================

    /**
     * 未认证（401）
     */
    public static <T> ApiResponse<T> unauthorized(String message) {
        return new ApiResponse<>(401, message, null, System.currentTimeMillis());
    }

    /**
     * 无权限（403）
     */
    public static <T> ApiResponse<T> forbidden(String message) {
        return new ApiResponse<>(403, message, null, System.currentTimeMillis());
    }

    /**
     * 资源不存在（404）
     */
    public static <T> ApiResponse<T> notFound(String message) {
        return new ApiResponse<>(404, message, null, System.currentTimeMillis());
    }

    /**
     * 资源冲突（409）
     */
    public static <T> ApiResponse<T> conflict(String message) {
        return new ApiResponse<>(409, message, null, System.currentTimeMillis());
    }

    /**
     * 服务器内部错误（500）
     */
    public static <T> ApiResponse<T> serverError(String message) {
        return new ApiResponse<>(500, message, null, System.currentTimeMillis());
    }
}
