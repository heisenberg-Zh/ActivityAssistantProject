package com.activityassistant.controller;

import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.CreateActivityConfigVO;
import com.activityassistant.service.AppFeatureConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 应用/小程序配置接口。
 */
@RestController
@RequestMapping("/api/app-config")
@RequiredArgsConstructor
@Tag(name = "应用配置接口", description = "应用级开关配置")
public class AppConfigController {

    private final AppFeatureConfigService appFeatureConfigService;

    @GetMapping("/create-activity")
    @Operation(summary = "获取功能开关配置", description = "返回创建活动开关与审核模式开关")
    public ApiResponse<CreateActivityConfigVO> getCreateActivityConfig() {
        return ApiResponse.success(appFeatureConfigService.getCreateActivityConfig());
    }
}
