package com.activityassistant.controller;

import com.activityassistant.dto.request.ActivityQueryRequest;
import com.activityassistant.dto.request.CreateActivityRequest;
import com.activityassistant.dto.request.UpdateActivityRequest;
import com.activityassistant.dto.response.ActivityVO;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.ActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * 活动控制器
 *
 * @author Claude
 * @since 2025-11-10
 */
@Slf4j
@RestController
@RequestMapping("/api/activities")
@Tag(name = "活动管理", description = "活动相关接口")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    /**
     * 创建活动
     *
     * @param request 创建活动请求
     * @return 活动详情
     */
    @PostMapping
    @Operation(summary = "创建活动", description = "创建新的活动")
    public ApiResponse<ActivityVO> createActivity(@Valid @RequestBody CreateActivityRequest request) {
        log.info("收到创建活动请求: {}", request.getTitle());
        String userId = SecurityUtils.getCurrentUserId();
        ActivityVO activity = activityService.createActivity(request, userId);
        return ApiResponse.success(activity);
    }

    /**
     * 查询活动列表
     *
     * @param queryRequest 查询条件
     * @return 活动列表（分页）
     */
    @GetMapping
    @Operation(summary = "查询活动列表", description = "支持分页、筛选、搜索")
    public ApiResponse<Page<ActivityVO>> getActivityList(ActivityQueryRequest queryRequest) {
        log.info("收到查询活动列表请求: {}", queryRequest);
        String userId = SecurityUtils.getCurrentUserIdOrNull();
        Page<ActivityVO> activityPage = activityService.getActivityList(queryRequest, userId);
        return ApiResponse.success(activityPage);
    }

    /**
     * 查询活动详情
     *
     * @param id 活动ID
     * @return 活动详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "查询活动详情", description = "根据活动ID查询详情")
    public ApiResponse<ActivityVO> getActivityDetail(@PathVariable String id) {
        log.info("收到查询活动详情请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserIdOrNull();
        ActivityVO activity = activityService.getActivityDetail(id, userId);
        return ApiResponse.success(activity);
    }

    /**
     * 更新活动
     *
     * @param id      活动ID
     * @param request 更新请求
     * @return 活动详情
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新活动", description = "更新活动信息（仅组织者）")
    public ApiResponse<ActivityVO> updateActivity(
            @PathVariable String id,
            @Valid @RequestBody UpdateActivityRequest request) {
        log.info("收到更新活动请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        ActivityVO activity = activityService.updateActivity(id, request, userId);
        return ApiResponse.success(activity);
    }

    /**
     * 删除活动
     *
     * @param id 活动ID
     * @return 成功消息
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除活动", description = "删除活动（软删除，仅组织者）")
    public ApiResponse<String> deleteActivity(@PathVariable String id) {
        log.info("收到删除活动请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        activityService.deleteActivity(id, userId);
        return ApiResponse.success("活动删除成功");
    }

    /**
     * 发布活动
     *
     * @param id 活动ID
     * @return 活动详情
     */
    @PostMapping("/{id}/publish")
    @Operation(summary = "发布活动", description = "将活动状态改为已发布")
    public ApiResponse<ActivityVO> publishActivity(@PathVariable String id) {
        log.info("收到发布活动请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        ActivityVO activity = activityService.publishActivity(id, userId);
        return ApiResponse.success(activity);
    }

    /**
     * 取消活动
     *
     * @param id 活动ID
     * @return 活动详情
     */
    @PostMapping("/{id}/cancel")
    @Operation(summary = "取消活动", description = "取消活动（仅组织者）")
    public ApiResponse<ActivityVO> cancelActivity(@PathVariable String id) {
        log.info("收到取消活动请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        ActivityVO activity = activityService.cancelActivity(id, userId);
        return ApiResponse.success(activity);
    }

    /**
     * 查询我创建的活动
     *
     * @param page 页码
     * @param size 每页数量
     * @return 活动列表
     */
    @GetMapping("/my-activities")
    @Operation(summary = "查询我创建的活动", description = "查询当前用户创建的所有活动")
    public ApiResponse<Page<ActivityVO>> getMyActivities(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("收到查询我创建的活动请求");
        String userId = SecurityUtils.getCurrentUserId();

        ActivityQueryRequest queryRequest = new ActivityQueryRequest();
        queryRequest.setOrganizerId(userId);
        queryRequest.setPage(page);
        queryRequest.setSize(size);
        queryRequest.setSortBy("createdAt");
        queryRequest.setSortDirection("desc");

        Page<ActivityVO> activityPage = activityService.getActivityList(queryRequest, userId);
        return ApiResponse.success(activityPage);
    }
}
