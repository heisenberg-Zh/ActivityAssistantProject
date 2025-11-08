package com.activityassistant.controller;

import com.activityassistant.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 *
 * <p>提供系统健康检查和状态查询接口，用于验证服务是否正常运行。
 *
 * @author Claude
 * @since 2025-01-08
 */
@Slf4j
@RestController
@RequestMapping("/api")
@Tag(name = "系统管理", description = "系统健康检查和状态查询接口")
public class HealthController {

    @Value("${spring.application.name}")
    private String applicationName;

    @Value("${spring.profiles.active}")
    private String activeProfile;

    /**
     * 健康检查接口
     *
     * @return 系统状态信息
     */
    @GetMapping("/health")
    @Operation(summary = "健康检查", description = "检查系统是否正常运行")
    public ApiResponse<Map<String, Object>> health() {
        log.info("健康检查请求");

        Map<String, Object> data = new HashMap<>();
        data.put("status", "UP");
        data.put("application", applicationName);
        data.put("profile", activeProfile);
        data.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        return ApiResponse.success("系统运行正常", data);
    }

    /**
     * 欢迎接口
     *
     * @return 欢迎信息
     */
    @GetMapping("/welcome")
    @Operation(summary = "欢迎页面", description = "返回项目欢迎信息")
    public ApiResponse<Map<String, String>> welcome() {
        Map<String, String> data = new HashMap<>();
        data.put("message", "欢迎使用 ActivityAssistant 后端服务");
        data.put("version", "v1.0.0");
        data.put("documentation", "http://localhost:8080/swagger-ui.html");

        return ApiResponse.success(data);
    }

    /**
     * 测试异常处理
     *
     * @return 永远不会返回，会抛出异常
     */
    @GetMapping("/test-error")
    @Operation(summary = "测试异常处理", description = "测试全局异常处理器是否正常工作")
    public ApiResponse<Void> testError() {
        throw new RuntimeException("这是一个测试异常");
    }
}
