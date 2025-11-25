package com.activityassistant.controller;

import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.UserSimpleVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户列表控制器
 * 处理用户列表查询相关接口（复数形式的 /api/users 路径）
 *
 * @author Claude
 * @since 2025-01-23
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "用户列表接口", description = "用户列表查询相关接口")
public class UsersController {

    private final UserService userService;

    /**
     * 获取可添加为管理员的用户列表
     * 从所有已报名该活动的用户中，排除组织者和已有管理员
     *
     * @param activityId 活动ID
     * @return 可添加的用户列表
     */
    @GetMapping("/available-administrators")
    @Operation(summary = "获取可添加为管理员的用户列表", description = "获取指定活动中可以被添加为管理员的用户（已报名但不是组织者或管理员的用户）")
    public ApiResponse<List<UserSimpleVO>> getAvailableAdministrators(
            @Parameter(description = "活动ID", example = "A20251116000001", required = true)
            @RequestParam String activityId) {

        String currentUserId = SecurityUtils.getCurrentUserId();
        log.info("获取可添加为管理员的用户列表，activityId={}, currentUserId={}", activityId, currentUserId);

        List<UserSimpleVO> availableUsers = userService.getAvailableAdministrators(activityId, currentUserId);
        return ApiResponse.success(availableUsers);
    }
}
