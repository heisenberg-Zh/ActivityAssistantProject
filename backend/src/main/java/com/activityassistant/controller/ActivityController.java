package com.activityassistant.controller;

import com.activityassistant.dto.request.ActivityQueryRequest;
import com.activityassistant.dto.request.CreateActivityRequest;
import com.activityassistant.dto.request.HomeActivityQueryRequest;
import com.activityassistant.dto.request.UpdateActivityRequest;
import com.activityassistant.dto.response.ActivityVO;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.ActivityService;
import com.activityassistant.service.AppFeatureConfigService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 活动相关接口。
 */
@Slf4j
@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @Autowired
    private AppFeatureConfigService appFeatureConfigService;

    @PostMapping
    public ApiResponse<ActivityVO> createActivity(@Valid @RequestBody CreateActivityRequest request) {
        log.info("收到创建活动请求: {}", request.getTitle());
        String userId = SecurityUtils.getCurrentUserId();
        ActivityVO activity = activityService.createActivity(request, userId);
        return ApiResponse.success(activity);
    }

    @GetMapping
    public ApiResponse<Page<ActivityVO>> getActivityList(ActivityQueryRequest queryRequest) {
        log.info("收到查询活动列表请求: {}", queryRequest);
        String userId = SecurityUtils.getCurrentUserIdOrNull();
        Page<ActivityVO> activityPage = activityService.getActivityList(queryRequest, userId);
        return ApiResponse.success(activityPage);
    }

    @GetMapping("/{id}")
    public ApiResponse<ActivityVO> getActivityDetail(
            @PathVariable String id,
            @RequestParam(required = false) String shareToken,
            @RequestParam(required = false) String from) {
        log.info("收到查询活动详情请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserIdOrNull();
        boolean fromShare = "share".equalsIgnoreCase(from);
        ActivityVO activity = activityService.getActivityDetail(id, userId, shareToken, fromShare);
        if (appFeatureConfigService.isReviewModeEnabled() && activity != null) {
            activity.setOrganizerPhone(null);
            activity.setOrganizerWechat(null);
        }
        return ApiResponse.success(activity);
    }

    @GetMapping("/{id}/share-token")
    public ApiResponse<String> getPrivateActivityShareToken(@PathVariable String id) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, "审核模式已开启，暂不支持活动分享");
        }
        String userId = SecurityUtils.getCurrentUserId();
        String token = activityService.getOrCreatePrivateShareToken(id, userId);
        return ApiResponse.success(token);
    }

    @GetMapping("/related-private")
    public ApiResponse<Page<ActivityVO>> getRelatedPrivateActivities(ActivityQueryRequest queryRequest) {
        String userId = SecurityUtils.getCurrentUserId();
        Page<ActivityVO> activityPage = activityService.getRelatedPrivateActivities(queryRequest, userId);
        return ApiResponse.success(activityPage);
    }

    @GetMapping("/home")
    public ApiResponse<Page<ActivityVO>> getHomeActivities(HomeActivityQueryRequest queryRequest) {
        String userId = SecurityUtils.getCurrentUserIdOrNull();
        Page<ActivityVO> activityPage = activityService.getHomeActivities(queryRequest, userId);
        return ApiResponse.success(activityPage);
    }

    @PutMapping("/{id}")
    public ApiResponse<ActivityVO> updateActivity(
            @PathVariable String id,
            @Valid @RequestBody UpdateActivityRequest request) {
        log.info("收到更新活动请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        ActivityVO activity = activityService.updateActivity(id, request, userId);
        return ApiResponse.success(activity);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteActivity(@PathVariable String id) {
        log.info("收到删除活动请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        activityService.deleteActivity(id, userId);
        return ApiResponse.success("删除成功");
    }

    @PostMapping("/{id}/publish")
    public ApiResponse<ActivityVO> publishActivity(@PathVariable String id) {
        log.info("收到发布活动请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        ActivityVO activity = activityService.publishActivity(id, userId);
        return ApiResponse.success(activity);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<ActivityVO> cancelActivity(@PathVariable String id) {
        log.info("收到取消活动请求，活动ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        ActivityVO activity = activityService.cancelActivity(id, userId);
        return ApiResponse.success(activity);
    }

    @GetMapping("/my-activities")
    public ApiResponse<Page<ActivityVO>> getMyActivities(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("收到查询我创建活动列表请求");
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

    @GetMapping("/managed-activities")
    public ApiResponse<Page<ActivityVO>> getManagedActivities(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        String userId = SecurityUtils.getCurrentUserId();
        Page<ActivityVO> activityPage = activityService.getManagedActivities(page, size, userId);
        return ApiResponse.success(activityPage);
    }
}