package com.activityassistant.controller;

import com.activityassistant.dto.request.CreateReviewRequest;
import com.activityassistant.dto.request.DeleteReviewRequest;
import com.activityassistant.dto.request.UpdateReviewRequest;
import com.activityassistant.dto.response.ApiResponse;
import com.activityassistant.dto.response.ReviewStatisticsResponse;
import com.activityassistant.model.Review;
import com.activityassistant.security.SecurityUtils;
import com.activityassistant.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

/**
 * 评价控制器
 *
 * @author Claude
 * @since 2025-01-20
 */
@Slf4j
@RestController
@RequestMapping("/api/reviews")
@Tag(name = "评价管理", description = "活动评价相关接口")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    /**
     * 创建或更新评价
     *
     * @param request 创建评价请求
     * @return 评价信息
     */
    @PostMapping
    @Operation(summary = "创建或更新评价", description = "用户对已参加的已结束活动进行评价")
    public ApiResponse<Review> createOrUpdateReview(@Valid @RequestBody CreateReviewRequest request) {
        log.info("收到创建/更新评价请求，活动ID: {}", request.getActivityId());
        String userId = SecurityUtils.getCurrentUserId();
        Review review = reviewService.createOrUpdateReview(request, userId);
        return ApiResponse.success(review);
    }

    /**
     * 更新评价
     *
     * @param id      评价ID
     * @param request 更新评价请求
     * @return 评价信息
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新评价", description = "用户更新自己的评价")
    public ApiResponse<Review> updateReview(
            @PathVariable String id,
            @Valid @RequestBody UpdateReviewRequest request) {
        log.info("收到更新评价请求，评价ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        Review review = reviewService.updateReview(id, request, userId);
        return ApiResponse.success(review);
    }

    /**
     * 删除评价（用户删除自己的评价）
     *
     * @param id 评价ID
     * @return 成功消息
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除评价", description = "用户删除自己的评价")
    public ApiResponse<String> deleteReview(@PathVariable String id) {
        log.info("收到删除评价请求，评价ID: {}", id);
        String userId = SecurityUtils.getCurrentUserId();
        reviewService.deleteReview(id, userId);
        return ApiResponse.success("评价删除成功");
    }

    /**
     * 管理员删除评价
     *
     * @param id      评价ID
     * @param request 删除请求（包含删除原因）
     * @return 成功消息
     */
    @DeleteMapping("/{id}/admin")
    @Operation(summary = "管理员删除评价", description = "管理员删除不当评价并说明原因")
    public ApiResponse<String> deleteReviewByAdmin(
            @PathVariable String id,
            @Valid @RequestBody DeleteReviewRequest request) {
        log.info("收到管理员删除评价请求，评价ID: {}, 原因: {}", id, request.getDeleteReason());
        String adminId = SecurityUtils.getCurrentUserId();
        reviewService.deleteReviewByAdmin(id, adminId, request.getDeleteReason());
        return ApiResponse.success("评价已删除");
    }

    /**
     * 获取我的评价
     *
     * @param activityId 活动ID
     * @return 评价信息（如果已评价），否则返回null
     */
    @GetMapping("/my")
    @Operation(summary = "获取我的评价", description = "查询当前用户对指定活动的评价")
    public ApiResponse<Review> getMyReview(@RequestParam String activityId) {
        log.info("收到查询我的评价请求，活动ID: {}", activityId);
        String userId = SecurityUtils.getCurrentUserId();
        Review review = reviewService.getMyReview(activityId, userId);
        return ApiResponse.success(review);
    }

    /**
     * 检查是否已评价
     *
     * @param activityId 活动ID
     * @return 是否已评价
     */
    @GetMapping("/check")
    @Operation(summary = "检查是否已评价", description = "检查当前用户是否已评价指定活动")
    public ApiResponse<Boolean> checkReviewed(@RequestParam String activityId) {
        log.info("收到检查评价状态请求，活动ID: {}", activityId);
        String userId = SecurityUtils.getCurrentUserId();
        boolean hasReviewed = reviewService.hasUserReviewed(activityId, userId);
        return ApiResponse.success(hasReviewed);
    }

    /**
     * 获取活动评价列表（管理员查看）
     *
     * @param activityId 活动ID
     * @param rating     评分筛选（null表示全部）
     * @param sortBy     排序方式（latest/rating）
     * @param page       页码
     * @param size       每页数量
     * @return 评价列表
     */
    @GetMapping("/activity/{activityId}")
    @Operation(summary = "获取活动评价列表", description = "查询活动的所有评价（仅管理员）")
    public ApiResponse<Page<Review>> getActivityReviews(
            @PathVariable String activityId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        log.info("收到查询活动评价列表请求，活动ID: {}, 评分: {}, 排序: {}", activityId, rating, sortBy);
        Page<Review> reviewPage = reviewService.getActivityReviews(activityId, rating, sortBy, page, size);
        return ApiResponse.success(reviewPage);
    }

    /**
     * 获取评价统计数据
     *
     * @param activityId 活动ID
     * @return 评价统计
     */
    @GetMapping("/activity/{activityId}/statistics")
    @Operation(summary = "获取评价统计", description = "获取活动的评价统计数据（总数、平均分、分布）")
    public ApiResponse<ReviewStatisticsResponse> getReviewStatistics(@PathVariable String activityId) {
        log.info("收到查询评价统计请求，活动ID: {}", activityId);
        ReviewStatisticsResponse statistics = reviewService.getReviewStatistics(activityId);
        return ApiResponse.success(statistics);
    }
}
