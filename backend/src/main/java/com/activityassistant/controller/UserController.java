package com.activityassistant.controller;

import com.activityassistant.dto.request.UpdateUserRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.UserSimpleVO;
import com.activityassistant.dto.response.UserVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户控制器
 * 处理用户信息相关接口
 *
 * @author Claude
 * @since 2025-01-08
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "用户接口", description = "用户信息管理相关接口")
public class UserController {

    private final UserService userService;

    /**
     * 获取当前用户信息
     * 需要Token认证
     *
     * @return 用户信息（完整信息，不脱敏）
     */
    @GetMapping("/profile")
    @Operation(summary = "获取当前用户信息", description = "获取登录用户的完整信息（不脱敏）")
    public ApiResponse<UserVO> getProfile() {
        String userId = SecurityUtils.getCurrentUserId();
        log.info("获取用户信息，userId={}", userId);
        UserVO userVO = userService.getUserProfile(userId);
        return ApiResponse.success(userVO);
    }

    /**
     * 获取指定用户信息（查看他人信息）
     *
     * @param targetUserId 目标用户ID
     * @return 用户信息（脱敏）
     */
    @GetMapping("/{userId}")
    @Operation(summary = "获取指定用户信息", description = "查看其他用户的公开信息（手机号等敏感信息脱敏）")
    public ApiResponse<UserVO> getUserInfo(
            @Parameter(description = "用户ID", example = "u1")
            @PathVariable("userId") String targetUserId) {
        log.info("获取用户公开信息，targetUserId={}", targetUserId);
        UserVO userVO = userService.getUserInfo(targetUserId);
        return ApiResponse.success(userVO);
    }

    /**
     * 更新当前用户信息
     *
     * @param request 更新请求
     * @return 更新后的用户信息
     */
    @PutMapping("/profile")
    @Operation(summary = "更新当前用户信息", description = "更新登录用户的个人信息")
    public ApiResponse<UserVO> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        log.info("更新用户信息，userId={}, request={}", userId, request);
        UserVO userVO = userService.updateUserProfile(userId, request);
        return ApiResponse.success(userVO);
    }
}
