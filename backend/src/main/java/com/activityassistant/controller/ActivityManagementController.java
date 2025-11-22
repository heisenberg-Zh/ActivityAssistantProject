package com.activityassistant.controller;

import com.activityassistant.dto.request.AddAdministratorRequest;
import com.activityassistant.dto.request.AddBlacklistRequest;
import com.activityassistant.dto.request.AddWhitelistRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.UserSimpleVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.ActivityManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 活动管理控制器
 * 处理活动管理员、白名单、黑名单相关接口
 *
 * @author Claude
 * @since 2025-01-22
 */
@Slf4j
@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
@Tag(name = "活动管理接口", description = "活动管理员、白名单、黑名单管理相关接口")
public class ActivityManagementController {

    private final ActivityManagementService activityManagementService;

    // ============================================
    // 管理员管理
    // ============================================

    /**
     * 获取活动管理员列表
     */
    @GetMapping("/{activityId}/administrators")
    @Operation(summary = "获取活动管理员列表", description = "获取指定活动的所有管理员")
    public ApiResponse<List<UserSimpleVO>> getAdministrators(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        List<UserSimpleVO> administrators = activityManagementService.getAdministrators(activityId, currentUserId);
        return ApiResponse.success(administrators);
    }

    /**
     * 添加管理员
     */
    @PostMapping("/{activityId}/administrators")
    @Operation(summary = "添加管理员", description = "为活动添加一个管理员（仅组织者或管理员可操作）")
    public ApiResponse<Void> addAdministrator(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @RequestBody AddAdministratorRequest request) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.addAdministrator(activityId, request.getUserId(), currentUserId);
        return ApiResponse.success(null, "添加管理员成功");
    }

    /**
     * 移除管理员
     */
    @DeleteMapping("/{activityId}/administrators/{userId}")
    @Operation(summary = "移除管理员", description = "从活动管理员列表中移除指定用户（仅组织者或管理员可操作）")
    public ApiResponse<Void> removeAdministrator(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "用户ID")
            @PathVariable String userId) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.removeAdministrator(activityId, userId, currentUserId);
        return ApiResponse.success(null, "移除管理员成功");
    }

    // ============================================
    // 白名单管理
    // ============================================

    /**
     * 获取活动白名单列表
     */
    @GetMapping("/{activityId}/whitelist")
    @Operation(summary = "获取活动白名单列表", description = "获取指定活动的白名单（手机号列表）")
    public ApiResponse<List<String>> getWhitelist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        List<String> whitelist = activityManagementService.getWhitelist(activityId, currentUserId);
        return ApiResponse.success(whitelist);
    }

    /**
     * 批量添加白名单
     */
    @PostMapping("/{activityId}/whitelist")
    @Operation(summary = "批量添加白名单", description = "批量添加手机号或用户ID到白名单（仅组织者或管理员可操作）")
    public ApiResponse<Void> addToWhitelist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @RequestBody AddWhitelistRequest request) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.addToWhitelist(activityId, request.getPhones(), request.getUserIds(), currentUserId);
        return ApiResponse.success(null, "添加白名单成功");
    }

    /**
     * 从白名单移除
     */
    @DeleteMapping("/{activityId}/whitelist/{phone}")
    @Operation(summary = "从白名单移除", description = "从白名单中移除指定手机号（仅组织者或管理员可操作）")
    public ApiResponse<Void> removeFromWhitelist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "手机号")
            @PathVariable String phone) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.removeFromWhitelist(activityId, phone, currentUserId);
        return ApiResponse.success(null, "移除白名单成功");
    }

    // ============================================
    // 黑名单管理
    // ============================================

    /**
     * 获取活动黑名单列表
     */
    @GetMapping("/{activityId}/blacklist")
    @Operation(summary = "获取活动黑名单列表", description = "获取指定活动的黑名单（包含手机号、原因、过期时间等信息）")
    public ApiResponse<List<Map<String, Object>>> getBlacklist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        List<Map<String, Object>> blacklist = activityManagementService.getBlacklist(activityId, currentUserId);
        return ApiResponse.success(blacklist);
    }

    /**
     * 批量添加黑名单
     */
    @PostMapping("/{activityId}/blacklist")
    @Operation(summary = "批量添加黑名单", description = "批量添加手机号到黑名单（仅组织者或管理员可操作）")
    public ApiResponse<Void> addToBlacklist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @RequestBody AddBlacklistRequest request) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.addToBlacklist(
                activityId,
                request.getPhones(),
                request.getReason(),
                request.getExpiryDays(),
                currentUserId
        );
        return ApiResponse.success(null, "添加黑名单成功");
    }

    /**
     * 从黑名单移除
     */
    @DeleteMapping("/{activityId}/blacklist/{phone}")
    @Operation(summary = "从黑名单移除", description = "从黑名单中移除指定手机号（仅组织者或管理员可操作）")
    public ApiResponse<Void> removeFromBlacklist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "手机号")
            @PathVariable String phone) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.removeFromBlacklist(activityId, phone, currentUserId);
        return ApiResponse.success(null, "移除黑名单成功");
    }
}
