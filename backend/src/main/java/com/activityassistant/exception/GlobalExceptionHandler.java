package com.activityassistant.exception;

import com.activityassistant.dto.response.ApiResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 全局异常处理器
 *
 * <p>统一捕获和处理所有异常，将异常转换为标准的 ApiResponse 格式返回给前端。
 *
 * <p>处理的异常类型：
 * <ul>
 *   <li>BusinessException - 业务逻辑异常</li>
 *   <li>MethodArgumentNotValidException - 参数校验异常（@Valid）</li>
 *   <li>ConstraintViolationException - 参数约束异常</li>
 *   <li>Exception - 其他未知异常</li>
 * </ul>
 *
 * @author Claude
 * @since 2025-01-08
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Object>> handleBusinessException(BusinessException e) {
        log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());

        ApiResponse<Object> response = ApiResponse.error(e.getCode(), e.getMessage(), e.getData());
        HttpStatus httpStatus = getHttpStatusByCode(e.getCode());

        return ResponseEntity.status(httpStatus).body(response);
    }

    /**
     * 处理参数校验异常（@Valid 触发）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException e) {

        log.warn("参数校验失败: {}", e.getMessage());

        // 收集所有字段错误
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : e.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        ApiResponse<Map<String, String>> response = ApiResponse.error(400, "参数校验失败", errors);
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理 BindException 异常
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleBindException(BindException e) {
        log.warn("参数绑定失败: {}", e.getMessage());

        Map<String, String> errors = new HashMap<>();
        for (FieldError error : e.getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        ApiResponse<Map<String, String>> response = ApiResponse.error(400, "参数绑定失败", errors);
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理约束校验异常
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolationException(
            ConstraintViolationException e) {

        log.warn("约束校验失败: {}", e.getMessage());

        Map<String, String> errors = e.getConstraintViolations()
                .stream()
                .collect(Collectors.toMap(
                        violation -> violation.getPropertyPath().toString(),
                        ConstraintViolation::getMessage
                ));

        ApiResponse<Map<String, String>> response = ApiResponse.error(400, "参数约束校验失败", errors);
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理参数类型不匹配异常
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleTypeMismatchException(
            MethodArgumentTypeMismatchException e) {

        log.warn("参数类型不匹配: 参数名={}, 期望类型={}, 实际值={}",
                e.getName(), e.getRequiredType(), e.getValue());

        String message = String.format("参数 '%s' 类型错误", e.getName());
        ApiResponse<Object> response = ApiResponse.error(400, message);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理未知异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleException(Exception e) {
        log.error("系统异常: {}", e.getMessage(), e);

        // 生产环境隐藏详细错误信息，避免泄露敏感信息
        String message = "服务器内部错误，请稍后重试";
        if (log.isDebugEnabled()) {
            message = e.getMessage();  // 开发环境显示详细错误
        }

        ApiResponse<Object> response = ApiResponse.error(500, message);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * 根据错误码映射 HTTP 状态码
     */
    private HttpStatus getHttpStatusByCode(Integer code) {
        if (code == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return switch (code) {
            case 400 -> HttpStatus.BAD_REQUEST;
            case 401 -> HttpStatus.UNAUTHORIZED;
            case 403 -> HttpStatus.FORBIDDEN;
            case 404 -> HttpStatus.NOT_FOUND;
            case 409 -> HttpStatus.CONFLICT;
            case 429 -> HttpStatus.TOO_MANY_REQUESTS;
            default -> code >= 500 ? HttpStatus.INTERNAL_SERVER_ERROR : HttpStatus.BAD_REQUEST;
        };
    }
}
