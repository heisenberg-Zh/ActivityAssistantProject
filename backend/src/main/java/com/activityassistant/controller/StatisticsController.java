package com.activityassistant.controller;

import com.activityassistant.dto.response.ActivityStatisticsVO;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.UserStatisticsVO;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 统计控制器
 *
 * @author Claude
 * @since 2025-11-11
 */
@Slf4j
@RestController
@RequestMapping("/api/statistics")
@Tag(name = "统计管理", description = "统计相关接口")
public class StatisticsController {

    @Autowired
    private StatisticsService statisticsService;

    /**
     * 获取活动统计数据
     *
     * @param id 活动ID
     * @return 活动统计数据
     */
    @GetMapping("/activities/{id}")
    @Operation(summary = "获取活动统计", description = "获取活动的详细统计数据（仅组织者/管理员）")
    public ApiResponse<ActivityStatisticsVO> getActivityStatistics(@PathVariable String id) {
        log.info("收到获取活动统计请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        ActivityStatisticsVO statistics = statisticsService.getActivityStatistics(id, userId);
        return ApiResponse.success(statistics);
    }

    /**
     * 获取用户统计数据
     *
     * @param id 用户ID
     * @return 用户统计数据
     */
    @GetMapping("/users/{id}")
    @Operation(summary = "获取用户统计", description = "获取用户的参与统计数据")
    public ApiResponse<UserStatisticsVO> getUserStatistics(@PathVariable String id) {
        log.info("收到获取用户统计请求，用户ID: {}", id);
        String currentUserId = SecurityUtils.getCurrentUserId();
        UserStatisticsVO statistics = statisticsService.getUserStatistics(id, currentUserId);
        return ApiResponse.success(statistics);
    }

    /**
     * 获取我的统计数据
     *
     * @return 用户统计数据
     */
    @GetMapping("/my")
    @Operation(summary = "获取我的统计", description = "获取当前用户的统计数据")
    public ApiResponse<UserStatisticsVO> getMyStatistics() {
        log.info("收到获取我的统计请求");
        String userId = SecurityUtils.getCurrentUserId();
        UserStatisticsVO statistics = statisticsService.getUserStatistics(userId, userId);
        return ApiResponse.success(statistics);
    }
}
