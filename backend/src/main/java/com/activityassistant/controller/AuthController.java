package com.activityassistant.controller;

import com.activityassistant.dto.request.LoginRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.LoginResponse;
import com.activityassistant.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证控制器
 * 处理登录、注册等认证相关接口
 *
 * @author Claude
 * @since 2025-01-08
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "认证接口", description = "用户登录、注册等认证相关接口")
public class AuthController {

    private final UserService userService;

    /**
     * 微信小程序登录
     * 开发环境：传code="test_code_dev"即可登录
     * 生产环境：传微信小程序wx.login()返回的code
     *
     * @param request 登录请求
     * @return 登录响应（包含Token和用户信息）
     */
    @PostMapping("/login")
    @Operation(summary = "微信登录", description = "微信小程序登录（开发环境code传test_code_dev）")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("收到登录请求，code={}", request.getCode());
        LoginResponse response = userService.login(request.getCode());
        return ApiResponse.success(response);
    }
}
