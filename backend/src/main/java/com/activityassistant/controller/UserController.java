package com.activityassistant.controller;

import com.activityassistant.dto.request.UpdateUserRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.UserVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.AppFeatureConfigService;
import com.activityassistant.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户相关接口。
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AppFeatureConfigService appFeatureConfigService;

    @GetMapping("/profile")
    public ApiResponse<UserVO> getProfile() {
        String userId = SecurityUtils.getCurrentUserId();
        log.info("获取用户信息，userId={}", userId);
        UserVO userVO = userService.getUserProfile(userId);
        return ApiResponse.success(userVO);
    }

    @GetMapping("/{userId}")
    public ApiResponse<UserVO> getUserInfo(@PathVariable("userId") String targetUserId) {
        log.info("获取用户公开信息，targetUserId={}", targetUserId);
        UserVO userVO = userService.getUserInfo(targetUserId);
        return ApiResponse.success(userVO);
    }

    @PutMapping("/profile")
    public ApiResponse<UserVO> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            request.setPhone(null);
        }
        String userId = SecurityUtils.getCurrentUserId();
        log.info("更新用户信息，userId={}, request={}", userId, request);
        UserVO userVO = userService.updateUserProfile(userId, request);
        return ApiResponse.success(userVO);
    }
}