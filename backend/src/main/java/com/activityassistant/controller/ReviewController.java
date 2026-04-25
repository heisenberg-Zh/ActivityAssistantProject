package com.activityassistant.controller;

import com.activityassistant.dto.request.CreateReviewRequest;
import com.activityassistant.dto.request.DeleteReviewRequest;
import com.activityassistant.dto.request.UpdateReviewRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.ReviewStatisticsResponse;
import com.activityassistant.model.Review;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.AppFeatureConfigService;
import com.activityassistant.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
 * 活动评价接口。
 */
@Slf4j
@RestController
@RequestMapping("/api/reviews")
@Tag(name = "评价管理", description = "活动评价相关接口")
public class ReviewController {

    private static final String REVIEW_MODE_MESSAGE = "审核模式已开启，暂不支持活动评价功能";

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private AppFeatureConfigService appFeatureConfigService;

    @PostMapping
    @Operation(summary = "创建或更新评价", description = "用户对已参加的已结束活动进行评价")
    public ApiResponse<Review> createOrUpdateReview(@Valid @RequestBody CreateReviewRequest request) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        log.info("收到创建/更新评价请求，活动ID: {}", request.getActivityId());
        String userId = SecurityUtils.getCurrentUserId();
        Review review = reviewService.createOrUpdateReview(request, userId);
        return ApiResponse.success(review);
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新评价", description = "用户更新自己的评价")
    public ApiResponse<Review> updateReview(
            @PathVariable String id,
            @Valid @RequestBody UpdateReviewRequest request) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        log.info("收到更新评价请求，评价ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        Review review = reviewService.updateReview(id, request, userId);
        return ApiResponse.success(review);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除评价", description = "用户删除自己的评价")
    public ApiResponse<String> deleteReview(@PathVariable String id) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        log.info("收到删除评价请求，评价ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        reviewService.deleteReview(id, userId);
        return ApiResponse.success("评价删除成功");
    }

    @DeleteMapping("/{id}/admin")
    @Operation(summary = "管理员删除评价", description = "管理员删除不当评价并说明原因")
    public ApiResponse<String> deleteReviewByAdmin(
            @PathVariable String id,
            @Valid @RequestBody DeleteReviewRequest request) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        log.info("收到管理员删除评价请求，评价ID: {}, 原因: {}", id, request.getDeleteReason());
        String adminId = SecurityUtils.getCurrentUserId();
        reviewService.deleteReviewByAdmin(id, adminId, request.getDeleteReason());
        return ApiResponse.success("评价已删除");
    }

    @GetMapping("/my")
    @Operation(summary = "获取我的评价", description = "查询当前用户对指定活动的评价")
    public ApiResponse<Review> getMyReview(@RequestParam String activityId) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        log.info("收到查询我的评价请求，活动ID: {}", activityId);
        String userId = SecurityUtils.getCurrentUserId();
        Review review = reviewService.getMyReview(activityId, userId);
        return ApiResponse.success(review);
    }

    @GetMapping("/check")
    @Operation(summary = "检查是否已评价", description = "检查当前用户是否已评价指定活动")
    public ApiResponse<Boolean> checkReviewed(@RequestParam String activityId) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        log.info("收到检查评价状态请求，活动ID: {}", activityId);
        String userId = SecurityUtils.getCurrentUserId();
        boolean hasReviewed = reviewService.hasUserReviewed(activityId, userId);
        return ApiResponse.success(hasReviewed);
    }

    @GetMapping("/activity/{activityId}")
    @Operation(summary = "获取活动评价列表", description = "查询活动的所有评价")
    public ApiResponse<Page<Review>> getActivityReviews(
            @PathVariable String activityId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        log.info("收到查询活动评价列表请求，活动ID: {}, 评分: {}, 排序: {}", activityId, rating, sortBy);
        Page<Review> reviewPage = reviewService.getActivityReviews(activityId, rating, sortBy, page, size);
        return ApiResponse.success(reviewPage);
    }

    @GetMapping("/activity/{activityId}/statistics")
    @Operation(summary = "获取评价统计", description = "获取活动评价统计数据")
    public ApiResponse<ReviewStatisticsResponse> getReviewStatistics(@PathVariable String activityId) {
        if (appFeatureConfigService.isReviewModeEnabled()) {
            return ApiResponse.error(403, REVIEW_MODE_MESSAGE);
        }
        log.info("收到查询评价统计请求，活动ID: {}", activityId);
        ReviewStatisticsResponse statistics = reviewService.getReviewStatistics(activityId);
        return ApiResponse.success(statistics);
    }
}
