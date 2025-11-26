package com.activityassistant.service;

import com.activityassistant.dto.response.ActivityStatisticsVO;
import com.activityassistant.dto.response.UserStatisticsVO;
import com.activityassistant.exception.BusinessException;
import com.activityassistant.model.Activity;
import com.activityassistant.model.Review;
import com.activityassistant.model.User;
import com.activityassistant.repository.ActivityRepository;
import com.activityassistant.repository.CheckinRepository;
import com.activityassistant.repository.RegistrationRepository;
import com.activityassistant.repository.ReviewRepository;
import com.activityassistant.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import static com.activityassistant.constant.ErrorCode.NOT_FOUND;
import static com.activityassistant.constant.ErrorCode.PERMISSION_DENIED;

/**
 * 统计业务逻辑层
 *
 * @author Claude
 * @since 2025-11-11
 */
@Slf4j
@Service
public class StatisticsService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private CheckinRepository checkinRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    /**
     * 获取活动统计数据
     *
     * @param activityId 活动ID
     * @param userId     当前用户ID
     * @return 活动统计数据
     */
    public ActivityStatisticsVO getActivityStatistics(String activityId, String userId) {
        log.info("获取活动统计数据，活动: {}, 用户: {}", activityId, userId);

        // 1. 验证活动是否存在
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException(NOT_FOUND, "活动不存在"));

        // 2. 验证权限（只有组织者和管理员可以查看）
        if (!activity.getOrganizerId().equals(userId)) {
            // TODO: 检查是否为管理员
            throw new BusinessException(PERMISSION_DENIED, "无权查看此活动的统计数据");
        }

        // 3. 统计报名数据
        long totalRegistrations = registrationRepository.countByActivityId(activityId);
        long approvedRegistrations = registrationRepository.countByActivityIdAndStatus(activityId, "approved");
        long pendingRegistrations = registrationRepository.countByActivityIdAndStatus(activityId, "pending");
        long cancelledRegistrations = registrationRepository.countByActivityIdAndStatus(activityId, "cancelled");
        long rejectedRegistrations = registrationRepository.countByActivityIdAndStatus(activityId, "rejected");

        ActivityStatisticsVO.RegistrationStatsVO registrationStats =
                ActivityStatisticsVO.RegistrationStatsVO.builder()
                        .total(totalRegistrations)
                        .approved(approvedRegistrations)
                        .pending(pendingRegistrations)
                        .cancelled(cancelledRegistrations)
                        .rejected(rejectedRegistrations)
                        .build();

        // 4. 统计签到数据
        long totalCheckins = checkinRepository.countByActivityId(activityId);
        long lateCheckins = checkinRepository.countByActivityIdAndIsLate(activityId, true);
        long invalidCheckins = checkinRepository.countByActivityIdAndIsValid(activityId, false);

        // 计算签到率（签到人数 / 已通过报名人数）
        double checkinRate = 0.0;
        if (approvedRegistrations > 0) {
            checkinRate = (double) totalCheckins / approvedRegistrations * 100;
            // 保留一位小数
            checkinRate = Math.round(checkinRate * 10.0) / 10.0;
        }

        ActivityStatisticsVO.CheckinStatsVO checkinStats =
                ActivityStatisticsVO.CheckinStatsVO.builder()
                        .total(totalCheckins)
                        .late(lateCheckins)
                        .invalid(invalidCheckins)
                        .rate(checkinRate)
                        .build();

        // 5. 分组统计（暂不实现，需要解析activity.groups JSON）
        List<ActivityStatisticsVO.GroupStatsVO> groupStats = new ArrayList<>();
        // TODO: 实现分组统计

        // 6. 构建返回结果
        return ActivityStatisticsVO.builder()
                .activityId(activityId)
                .registrationStats(registrationStats)
                .checkinStats(checkinStats)
                .groupStats(groupStats)
                .build();
    }

    /**
     * 获取用户统计数据
     *
     * @param targetUserId 目标用户ID
     * @param currentUserId 当前用户ID
     * @return 用户统计数据
     */
    public UserStatisticsVO getUserStatistics(String targetUserId, String currentUserId) {
        log.info("获取用户统计数据，目标用户: {}, 当前用户: {}", targetUserId, currentUserId);

        // 1. 验证用户是否存在
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException(NOT_FOUND, "用户不存在"));

        // 2. 统计创建的活动数（包括已删除的）
        long createdActivities = activityRepository.countByOrganizerId(targetUserId);

        // 3. 统计参与的活动数（已通过报名的）
        long participatedActivities = registrationRepository.countByUserIdAndStatus(targetUserId, "approved");

        // 4. 统计总报名数
        long totalRegistrations = registrationRepository.countByUserId(targetUserId);

        // 5. 统计总签到数
        long totalCheckins = checkinRepository.countByUserId(targetUserId);

        // 6. 计算签到率（签到数 / 参与活动数）
        double checkinRate = 0.0;
        if (participatedActivities > 0) {
            checkinRate = (double) totalCheckins / participatedActivities * 100;
            // 保留一位小数
            checkinRate = Math.round(checkinRate * 10.0) / 10.0;
        }

        // 7. 统计迟到次数
        long lateCount = checkinRepository.countByUserIdAndIsLate(targetUserId, true);

        // 8. 统计无效签到次数
        long invalidCheckinCount = checkinRepository.countByUserIdAndIsValid(targetUserId, false);

        // 9. 统计获得的评价数（作为活动创建者）
        // 获取用户创建的所有活动
        List<Activity> createdActivitiesList = activityRepository.findByOrganizerId(targetUserId);
        List<String> activityIds = createdActivitiesList.stream()
                .map(Activity::getId)
                .toList();

        // 统计这些活动收到的评价总数
        long totalReviews = 0L;
        double totalRating = 0.0;
        int ratingCount = 0;

        for (String activityId : activityIds) {
            List<Review> reviews = reviewRepository.findByActivityIdAndIsDeletedFalseOrderByCreatedAtDesc(activityId);
            totalReviews += reviews.size();
            for (Review review : reviews) {
                if (review.getRating() != null) {
                    totalRating += review.getRating();
                    ratingCount++;
                }
            }
        }

        // 计算平均评分
        Double averageRating = null;
        if (ratingCount > 0) {
            averageRating = totalRating / ratingCount;
            // 保留一位小数
            averageRating = Math.round(averageRating * 10.0) / 10.0;
        }

        // 10. 构建返回结果
        return UserStatisticsVO.builder()
                .userId(targetUserId)
                .nickname(user.getNickname())
                .createdActivities(createdActivities)
                .participatedActivities(participatedActivities)
                .totalRegistrations(totalRegistrations)
                .totalCheckins(totalCheckins)
                .checkinRate(checkinRate)
                .lateCount(lateCount)
                .invalidCheckinCount(invalidCheckinCount)
                .totalReviews(totalReviews)
                .averageRating(averageRating)
                .build();
    }
}
