package com.activityassistant.service;

import com.activityassistant.dto.request.CreateReviewRequest;
import com.activityassistant.dto.request.UpdateReviewRequest;
import com.activityassistant.dto.response.ReviewStatisticsResponse;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.exception.NotFoundException;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Registration;
import com.activityassistant.model.Review;
import com.activityassistant.model.User;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.RegistrationRepository;
import com.activityassistant.repository.ReviewRepository;
import com.activityassistant.repository.UserRepository;
import com.activityassistant.util.ActivityStatusUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static com.activityassistant.constant.ErrorCode.*;

/**
 * 评价业务逻辑层
 *
 * @author Claude
 * @since 2025-01-20
 */
@Slf4j
@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IdGeneratorService idGeneratorService;

    /**
     * 创建或更新评价
     *
     * @param request 创建评价请求
     * @param userId  用户ID
     * @return 评价信息
     */
    @Transactional
    public Review createOrUpdateReview(CreateReviewRequest request, String userId) {
        log.info("创建/更新评价，用户ID: {}, 活动ID: {}", userId, request.getActivityId());

        // 1. 验证活动存在
        Activity activity = activityRepository.findByIdAndIsDeletedFalse(request.getActivityId())
                .orElseThrow(() -> new NotFoundException("活动不存在"));

        // 2. 验证活动已结束（动态判断：当前时间 >= 结束时间）
        if (!ActivityStatusUtils.isActivityFinished(activity)) {
            String statusText = ActivityStatusUtils.getActivityStatusText(activity);
            log.warn("活动 {} 尚未结束，当前状态: {}，无法评价", activity.getId(), statusText);
            throw new BusinessException(INVALID_OPERATION,
                String.format("只能评价已结束的活动，当前活动状态：%s", statusText));
        }
        log.info("活动 {} 已结束，允许评价", activity.getId());

        // 3. 验证用户已参加活动（报名状态为approved）
        Registration registration = registrationRepository.findByActivityIdAndUserId(request.getActivityId(), userId)
                .orElseThrow(() -> new BusinessException(PERMISSION_DENIED, "您未参加此活动，无法评价"));

        if (!"approved".equals(registration.getStatus())) {
            throw new BusinessException(PERMISSION_DENIED, "您的报名未通过，无法评价");
        }

        // 4. 获取用户信息
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("用户不存在"));

        // 5. 检查是否已有评价
        Optional<Review> existingReview = reviewRepository.findByActivityIdAndUserIdAndIsDeletedFalse(
                request.getActivityId(), userId);

        Review review;
        if (existingReview.isPresent()) {
            // 更新现有评价
            review = existingReview.get();
            review.setRating(request.getRating());
            review.setContent(request.getContent());
            review.setUpdatedAt(LocalDateTime.now());
            log.info("更新现有评价，评价ID: {}", review.getId());
        } else {
            // 创建新评价
            review = Review.builder()
                    .id(idGeneratorService.generateReviewId())
                    .activityId(request.getActivityId())
                    .userId(userId)
                    .userName(user.getNickname())
                    .userAvatar(user.getAvatar())
                    .rating(request.getRating())
                    .content(request.getContent())
                    .isDeleted(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            log.info("创建新评价，评价ID: {}", review.getId());
        }

        return reviewRepository.save(review);
    }

    /**
     * 更新评价
     *
     * @param reviewId 评价ID
     * @param request  更新评价请求
     * @param userId   用户ID
     * @return 评价信息
     */
    @Transactional
    public Review updateReview(String reviewId, UpdateReviewRequest request, String userId) {
        log.info("更新评价，评价ID: {}, 用户ID: {}", reviewId, userId);

        // 1. 查找评价
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("评价不存在"));

        // 2. 验证权限（只能修改自己的评价）
        if (!review.getUserId().equals(userId)) {
            throw new BusinessException(PERMISSION_DENIED, "您无权修改此评价");
        }

        // 3. 验证评价未被删除
        if (review.getIsDeleted()) {
            throw new BusinessException(INVALID_OPERATION, "评价已被删除，无法修改");
        }

        // 4. 更新评价
        review.setRating(request.getRating());
        review.setContent(request.getContent());
        review.setUpdatedAt(LocalDateTime.now());

        return reviewRepository.save(review);
    }

    /**
     * 删除评价（用户删除自己的评价）
     *
     * @param reviewId 评价ID
     * @param userId   用户ID
     */
    @Transactional
    public void deleteReview(String reviewId, String userId) {
        log.info("删除评价，评价ID: {}, 用户ID: {}", reviewId, userId);

        // 1. 查找评价
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("评价不存在"));

        // 2. 验证权限
        if (!review.getUserId().equals(userId)) {
            throw new BusinessException(PERMISSION_DENIED, "您无权删除此评价");
        }

        // 3. 软删除
        review.setIsDeleted(true);
        review.setDeletedBy(userId);
        review.setDeletedAt(LocalDateTime.now());
        reviewRepository.save(review);

        log.info("评价删除成功，评价ID: {}", reviewId);
    }

    /**
     * 管理员删除评价
     *
     * @param reviewId     评价ID
     * @param adminId      管理员ID
     * @param deleteReason 删除原因
     */
    @Transactional
    public void deleteReviewByAdmin(String reviewId, String adminId, String deleteReason) {
        log.info("管理员删除评价，评价ID: {}, 管理员ID: {}, 原因: {}", reviewId, adminId, deleteReason);

        // 1. 查找评价
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("评价不存在"));

        // 2. 软删除
        review.setIsDeleted(true);
        review.setDeletedBy(adminId);
        review.setDeleteReason(deleteReason);
        review.setDeletedAt(LocalDateTime.now());
        reviewRepository.save(review);

        log.info("管理员删除评价成功，评价ID: {}", reviewId);
    }

    /**
     * 获取我的评价
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return 评价信息（如果已评价），否则返回null
     */
    public Review getMyReview(String activityId, String userId) {
        return reviewRepository.findByActivityIdAndUserIdAndIsDeletedFalse(activityId, userId)
                .orElse(null);
    }

    /**
     * 检查用户是否已评价
     *
     * @param activityId 活动ID
     * @param userId     用户ID
     * @return 是否已评价
     */
    public boolean hasUserReviewed(String activityId, String userId) {
        return reviewRepository.existsByActivityIdAndUserIdAndIsDeletedFalse(activityId, userId);
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
    public Page<Review> getActivityReviews(String activityId, Integer rating, String sortBy, int page, int size) {
        log.info("获取活动评价列表，活动ID: {}, 评分: {}, 排序: {}, 页码: {}", activityId, rating, sortBy, page);

        // 构建排序
        Sort sort;
        if ("rating".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "rating").and(Sort.by(Sort.Direction.DESC, "createdAt"));
        } else {
            // 默认最新优先
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        Pageable pageable = PageRequest.of(page, size, sort);

        // 根据是否有评分筛选
        if (rating != null) {
            return reviewRepository.findByActivityIdAndRatingAndIsDeletedFalse(activityId, rating, pageable);
        } else {
            return reviewRepository.findByActivityIdAndIsDeletedFalse(activityId, pageable);
        }
    }

    /**
     * 获取评价统计数据
     *
     * @param activityId 活动ID
     * @return 评价统计
     */
    public ReviewStatisticsResponse getReviewStatistics(String activityId) {
        log.info("获取评价统计，活动ID: {}", activityId);

        // 1. 总评价数
        long totalReviews = reviewRepository.countByActivityIdAndIsDeletedFalse(activityId);

        // 2. 平均评分
        Double averageRating = reviewRepository.getAverageRatingByActivityId(activityId);
        if (averageRating == null) {
            averageRating = 0.0;
        }

        // 3. 各星级分布
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            long count = reviewRepository.countByActivityIdAndRatingAndIsDeletedFalse(activityId, i);
            ratingDistribution.put(i, count);
        }

        return ReviewStatisticsResponse.builder()
                .totalReviews(totalReviews)
                .averageRating(Math.round(averageRating * 10.0) / 10.0) // 保留1位小数
                .ratingDistribution(ratingDistribution)
                .build();
    }
}
