package com.activityassistant.controller;

import com.activityassistant.dto.request.AddAdministratorRequest;
import com.activityassistant.dto.request.AddBlacklistRequest;
import com.activityassistant.dto.request.AddWhitelistRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.BlacklistEntryVO;
import com.activityassistant.dto.response.BlacklistUpdateResultVO;
import com.activityassistant.dto.response.RegisteredUserVO;
import com.activityassistant.dto.response.UserSimpleVO;
import com.activityassistant.dto.response.WhitelistUpdateResultVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.ActivityManagementService;
import com.activityassistant.service.AppFeatureConfigService;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 活动管理相关接口。
 */
@Slf4j
@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityManagementController {

    private static final String REVIEW_MODE_MESSAGE = "审核模式已开启，暂不支持该管理能力";

    private final ActivityManagementService activityManagementService;
    private final AppFeatureConfigService appFeatureConfigService;

    private boolean reviewModeEnabled() {
        return appFeatureConfigService.isReviewModeEnabled();
    }

    @GetMapping("/{activityId}/administrators")
    public ApiResponse<List<UserSimpleVO>> getAdministrators(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        List<UserSimpleVO> administrators = activityManagementService.getAdministrators(activityId, currentUserId);
        return ApiResponse.success(administrators);
    }

    @PostMapping("/{activityId}/administrators")
    public ApiResponse<Void> addAdministrator(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @RequestBody AddAdministratorRequest request) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.addAdministrator(activityId, request.getUserId(), currentUserId);
        return ApiResponse.success("添加管理员成功", null);
    }

    @DeleteMapping("/{activityId}/administrators/{userId}")
    public ApiResponse<Void> removeAdministrator(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "用户ID")
            @PathVariable String userId) {
        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.removeAdministrator(activityId, userId, currentUserId);
        return ApiResponse.success("移除管理员成功", null);
    }

    @GetMapping("/{activityId}/registered-users")
    public ApiResponse<List<RegisteredUserVO>> getRegisteredUsers(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {
        if (reviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        String currentUserId = SecurityUtils.getCurrentUserId();
        List<RegisteredUserVO> registeredUsers = activityManagementService.getRegisteredUsers(activityId, currentUserId);
        return ApiResponse.success(registeredUsers);
    }

    @GetMapping("/{activityId}/whitelist")
    public ApiResponse<List<UserSimpleVO>> getWhitelist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {
        if (reviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        String currentUserId = SecurityUtils.getCurrentUserId();
        List<UserSimpleVO> whitelist = activityManagementService.getWhitelist(activityId, currentUserId);
        return ApiResponse.success(whitelist);
    }

    @PostMapping("/{activityId}/whitelist")
    public ApiResponse<WhitelistUpdateResultVO> addToWhitelist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @RequestBody AddWhitelistRequest request) {
        if (reviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        String currentUserId = SecurityUtils.getCurrentUserId();
        WhitelistUpdateResultVO result = activityManagementService.addToWhitelist(
                activityId,
                request.getPhones(),
                request.getUserIds(),
                currentUserId
        );

        StringBuilder message = new StringBuilder("添加白名单成功");
        if (result != null && result.getAddedCount() > 0) {
            message.append("，新增").append(result.getAddedCount()).append("人");
        }
        return ApiResponse.success(message.toString(), result);
    }

    @DeleteMapping("/{activityId}/whitelist/{phone}")
    public ApiResponse<Void> removeFromWhitelist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "userId或手机号")
            @PathVariable String phone) {
        if (reviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.removeFromWhitelist(activityId, phone, currentUserId);
        return ApiResponse.success("移除白名单成功", null);
    }

    @GetMapping("/{activityId}/blacklist")
    public ApiResponse<List<BlacklistEntryVO>> getBlacklist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {
        if (reviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        String currentUserId = SecurityUtils.getCurrentUserId();
        List<BlacklistEntryVO> blacklist = activityManagementService.getBlacklist(activityId, currentUserId);
        return ApiResponse.success(blacklist);
    }

    @PostMapping("/{activityId}/blacklist")
    public ApiResponse<BlacklistUpdateResultVO> addToBlacklist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @RequestBody AddBlacklistRequest request) {
        if (reviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        String currentUserId = SecurityUtils.getCurrentUserId();
        BlacklistUpdateResultVO result = activityManagementService.addToBlacklist(
                activityId,
                request.getUserIds(),
                request.getPhones(),
                request.getReason(),
                request.getExpiryDays(),
                currentUserId
        );

        StringBuilder message = new StringBuilder("添加黑名单成功");
        if (result != null) {
            if (result.getAddedCount() > 0) {
                message.append("，新增").append(result.getAddedCount()).append("人");
            }
            if (result.getUnresolvedPhones() != null && !result.getUnresolvedPhones().isEmpty()) {
                message.append("，")
                        .append(result.getUnresolvedPhones().size())
                        .append("个手机号未绑定账号，已跳过");
            }
        }
        return ApiResponse.success(message.toString(), result);
    }

    @DeleteMapping("/{activityId}/blacklist/{phone}")
    public ApiResponse<Void> removeFromBlacklist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "userId或手机号（兼容历史数据）")
            @PathVariable String phone) {
        if (reviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.removeFromBlacklist(activityId, phone, currentUserId);
        return ApiResponse.success("移除黑名单成功", null);
    }

    @PutMapping("/{activityId}/blacklist/{key}/toggle")
    public ApiResponse<Void> toggleBlacklistActive(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "userId或手机号")
            @PathVariable String key) {
        if (reviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.toggleBlacklistActive(activityId, key, currentUserId);
        return ApiResponse.success("操作成功", null);
    }
}