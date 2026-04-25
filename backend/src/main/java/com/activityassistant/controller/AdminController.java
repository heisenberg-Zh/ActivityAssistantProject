package com.activityassistant.controller;

import com.activityassistant.dto.request.ActivityQueryRequest;
import com.activityassistant.dto.request.UpdateCreateActivityAdminOnlyRequest;
import com.activityassistant.dto.request.UpdateReviewModeEnabledRequest;
import com.activityassistant.dto.response.AdminMeVO;
import com.activityassistant.dto.response.ActivityVO;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.CreateActivityConfigVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.security.SystemAdminAccessChecker;
import com.activityassistant.service.ActivityService;
import com.activityassistant.service.AppFeatureConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 系统管理员相关接口。
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "系统管理员接口", description = "系统管理员专属能力")
public class AdminController {

    private final SystemAdminAccessChecker systemAdminAccessChecker;
    private final ActivityService activityService;
    private final AppFeatureConfigService appFeatureConfigService;

    @GetMapping("/me")
    @Operation(summary = "查询当前用户是否为系统管理员", description = "仅用于前端决定是否展示系统管理入口")
    public ApiResponse<AdminMeVO> getAdminMe() {
        String userId = SecurityUtils.getCurrentUserId();
        boolean isSystemAdmin = systemAdminAccessChecker.isSystemAdmin(userId);
        return ApiResponse.success(AdminMeVO.builder().systemAdmin(isSystemAdmin).build());
    }

    @GetMapping("/activities")
    @Operation(summary = "系统管理员查询活动列表", description = "系统管理员查看系统内所有活动")
    public ApiResponse<Page<ActivityVO>> listActivities(ActivityQueryRequest queryRequest) {
        String userId = SecurityUtils.getCurrentUserId();
        systemAdminAccessChecker.checkIsSystemAdmin(userId);
        Page<ActivityVO> activityPage = activityService.getSystemAdminActivityList(queryRequest, userId);
        return ApiResponse.success(activityPage);
    }

    @PutMapping("/system-settings/create-activity-admin-only")
    @Operation(summary = "更新创建活动开关", description = "开启后仅系统管理员可创建活动")
    public ApiResponse<CreateActivityConfigVO> updateCreateActivityAdminOnly(
            @Valid @RequestBody UpdateCreateActivityAdminOnlyRequest request
    ) {
        String userId = SecurityUtils.getCurrentUserId();
        systemAdminAccessChecker.checkIsSystemAdmin(userId);
        boolean adminOnly = Boolean.TRUE.equals(request.getAdminOnly());
        return ApiResponse.success(appFeatureConfigService.updateCreateActivityAdminOnly(adminOnly));
    }

    @PutMapping("/system-settings/review-mode-enabled")
    @Operation(summary = "更新审核模式开关", description = "开启后屏蔽审核敏感能力")
    public ApiResponse<CreateActivityConfigVO> updateReviewModeEnabled(
            @Valid @RequestBody UpdateReviewModeEnabledRequest request
    ) {
        String userId = SecurityUtils.getCurrentUserId();
        systemAdminAccessChecker.checkIsSystemAdmin(userId);
        boolean enabled = Boolean.TRUE.equals(request.getEnabled());
        return ApiResponse.success(appFeatureConfigService.updateReviewModeEnabled(enabled));
    }
}
