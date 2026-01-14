package com.activityassistant.controller;

import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.CreateActivityConfigVO;
import com.activityassistant.model.SystemSetting;
import com.activityassistant.repository.SystemSettingRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

/**
 * 应用/小程序配置接口
 */
@RestController
@RequestMapping("/api/app-config")
@RequiredArgsConstructor
@Tag(name = "应用配置接口", description = "应用级开关配置（需要登录）")
public class AppConfigController {

    private static final String KEY_CREATE_ACTIVITY_ADMIN_ONLY = "create_activity_admin_only";

    private final SystemSettingRepository systemSettingRepository;

    @GetMapping("/create-activity")
    @Operation(summary = "获取创建活动入口配置", description = "用于小程序首页“创建活动”按钮的前端管控。")
    public ApiResponse<CreateActivityConfigVO> getCreateActivityConfig() {
        boolean adminOnly = systemSettingRepository.findById(KEY_CREATE_ACTIVITY_ADMIN_ONLY)
                .map(SystemSetting::getSettingValue)
                .map(AppConfigController::isTruthy)
                .orElse(false);

        return ApiResponse.success(CreateActivityConfigVO.builder().createActivityAdminOnly(adminOnly).build());
    }

    private static boolean isTruthy(String value) {
        if (value == null) return false;
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return "1".equals(normalized)
                || "true".equals(normalized)
                || "on".equals(normalized)
                || "yes".equals(normalized);
    }
}

