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
        return ApiResponse.success("添加管理员成功", null);
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
        return ApiResponse.success("移除管理员成功", null);
    }

    // ============================================
    // 白名单管理
    // ============================================

    /**
     * 获取活动已报名用户列表（用于白名单/黑名单选择添加）
     */
    @GetMapping("/{activityId}/registered-users")
    @Operation(summary = "获取活动已报名用户列表", description = "获取指定活动的所有已报名用户（用于选择添加到白名单/黑名单）")
    public ApiResponse<List<RegisteredUserVO>> getRegisteredUsers(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        List<RegisteredUserVO> registeredUsers = activityManagementService.getRegisteredUsers(activityId, currentUserId);
        return ApiResponse.success(registeredUsers);
    }

    /**
     * 获取活动白名单列表
     */
    @GetMapping("/{activityId}/whitelist")
    @Operation(summary = "获取活动白名单列表", description = "获取指定活动的白名单用户列表（userId维度）")
    public ApiResponse<List<UserSimpleVO>> getWhitelist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        List<UserSimpleVO> whitelist = activityManagementService.getWhitelist(activityId, currentUserId);
        return ApiResponse.success(whitelist);
    }

    /**
     * 批量添加白名单
     */
    @PostMapping("/{activityId}/whitelist")
    @Operation(summary = "批量添加白名单", description = "批量添加手机号或用户ID到白名单（仅组织者或管理员可操作）")
    public ApiResponse<WhitelistUpdateResultVO> addToWhitelist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @RequestBody AddWhitelistRequest request) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        WhitelistUpdateResultVO result = activityManagementService.addToWhitelist(activityId, request.getPhones(), request.getUserIds(), currentUserId);

        StringBuilder message = new StringBuilder("添加白名单成功");
        if (result != null) {
            if (result.getAddedCount() > 0) {
                message.append("，新增").append(result.getAddedCount()).append("人");
            }
            if (result.getAutoApprovedCount() > 0) {
                message.append("，自动通过").append(result.getAutoApprovedCount()).append("人");
            }
            if (result.getAutoApproveSkippedBecauseFullCount() > 0) {
                message.append("，名额已满").append("，").append(result.getAutoApproveSkippedBecauseFullCount()).append("人未自动通过");
            }
            if (result.getUnresolvedPhones() != null && !result.getUnresolvedPhones().isEmpty()) {
                message.append("，").append(result.getUnresolvedPhones().size()).append("个手机号未绑定账号已跳过");
            }
        }

        return ApiResponse.success(message.toString(), result);
    }

    /**
     * 从白名单移除
     */
    @DeleteMapping("/{activityId}/whitelist/{phone}")
    @Operation(summary = "从白名单移除", description = "从白名单中移除指定用户（userId或手机号，兼容历史数据；仅组织者或管理员可操作）")
    public ApiResponse<Void> removeFromWhitelist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "userId或手机号")
            @PathVariable String phone) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.removeFromWhitelist(activityId, phone, currentUserId);
        return ApiResponse.success("移除白名单成功", null);
    }

    // ============================================
    // 黑名单管理
    // ============================================

    /**
     * 获取活动黑名单列表
     */
    @GetMapping("/{activityId}/blacklist")
    @Operation(summary = "获取活动黑名单列表", description = "获取指定活动的黑名单（包含手机号、原因、过期时间等信息）")
    public ApiResponse<List<BlacklistEntryVO>> getBlacklist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        List<BlacklistEntryVO> blacklist = activityManagementService.getBlacklist(activityId, currentUserId);
        return ApiResponse.success(blacklist);
    }

    /**
     * 批量添加黑名单
     */
    @PostMapping("/{activityId}/blacklist")
    @Operation(summary = "批量添加黑名单", description = "批量添加手机号到黑名单（仅组织者或管理员可操作）")
    public ApiResponse<BlacklistUpdateResultVO> addToBlacklist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @RequestBody AddBlacklistRequest request) {

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
                message.append("，").append(result.getUnresolvedPhones().size()).append("个手机号未绑定账号已跳过");
            }
        }

        return ApiResponse.success(message.toString(), result);
    }

    /**
     * 从黑名单移除
     */
    @DeleteMapping("/{activityId}/blacklist/{phone}")
    @Operation(summary = "从黑名单移除", description = "从黑名单中移除指定手机号（仅组织者或管理员可操作）")
    public ApiResponse<Void> removeFromBlacklist(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "userId或手机号（兼容历史数据）")
            @PathVariable String phone) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.removeFromBlacklist(activityId, phone, currentUserId);
        return ApiResponse.success("移除黑名单成功", null);
    }

    /**
     * 切换黑名单启用/禁用
     */
    @PutMapping("/{activityId}/blacklist/{key}/toggle")
    @Operation(summary = "切换黑名单状态", description = "启用/禁用指定黑名单条目（userId或手机号，兼容历史数据）")
    public ApiResponse<Void> toggleBlacklistActive(
            @Parameter(description = "活动ID", example = "A20251116000001")
            @PathVariable String activityId,
            @Parameter(description = "userId或手机号")
            @PathVariable String key) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        activityManagementService.toggleBlacklistActive(activityId, key, currentUserId);
        return ApiResponse.success("操作成功", null);
    }
}
