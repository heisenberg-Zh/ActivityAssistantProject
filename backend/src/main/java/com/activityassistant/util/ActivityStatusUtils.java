package com.activityassistant.util;

import com.activityassistant.model.Activity;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

/**
 * 活动状态工具类
 * 用于动态判断活动的实际状态（不依赖数据库status字段）
 *
 * @author Claude
 * @since 2025-01-20
 */
@Slf4j
public class ActivityStatusUtils {

    /**
     * 判断活动是否已结束
     *
     * @param activity 活动对象
     * @return 是否已结束
     */
    public static boolean isActivityFinished(Activity activity) {
        if (activity == null || activity.getEndTime() == null) {
            log.warn("活动对象或结束时间为空，无法判断是否已结束");
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        boolean isFinished = now.isAfter(activity.getEndTime()) || now.isEqual(activity.getEndTime());

        log.debug("活动 {} 是否已结束：{}，当前时间：{}，结束时间：{}",
            activity.getId(), isFinished, now, activity.getEndTime());

        return isFinished;
    }

    /**
     * 判断活动是否正在进行中
     *
     * @param activity 活动对象
     * @return 是否进行中
     */
    public static boolean isActivityOngoing(Activity activity) {
        if (activity == null || activity.getStartTime() == null || activity.getEndTime() == null) {
            log.warn("活动对象或时间字段为空，无法判断是否进行中");
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        return (now.isAfter(activity.getStartTime()) || now.isEqual(activity.getStartTime()))
            && now.isBefore(activity.getEndTime());
    }

    /**
     * 判断活动是否即将开始（报名已截止但尚未开始）
     *
     * @param activity 活动对象
     * @return 是否即将开始
     */
    public static boolean isActivityUpcoming(Activity activity) {
        if (activity == null || activity.getStartTime() == null || activity.getRegisterDeadline() == null) {
            log.warn("活动对象或时间字段为空，无法判断是否即将开始");
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        return (now.isAfter(activity.getRegisterDeadline()) || now.isEqual(activity.getRegisterDeadline()))
            && now.isBefore(activity.getStartTime());
    }

    /**
     * 判断活动是否正在报名中
     *
     * @param activity 活动对象
     * @return 是否报名中
     */
    public static boolean isActivityRegistering(Activity activity) {
        if (activity == null || activity.getRegisterDeadline() == null) {
            log.warn("活动对象或报名截止时间为空，无法判断是否报名中");
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        return now.isBefore(activity.getRegisterDeadline());
    }

    /**
     * 动态计算活动的实际状态
     * 注意：这个方法返回的是基于时间的动态状态，不是数据库中的status字段
     *
     * @param activity 活动对象
     * @return 活动状态（published/ongoing/finished）
     */
    public static String calculateActivityStatus(Activity activity) {
        if (activity == null) {
            return "unknown";
        }

        // 1. 如果数据库状态是取消或草稿，使用数据库状态（这些是固定状态）
        if ("cancelled".equals(activity.getStatus()) || "draft".equals(activity.getStatus())) {
            return activity.getStatus();
        }

        // 2. 根据时间动态判断状态
        LocalDateTime now = LocalDateTime.now();

        if (activity.getEndTime() != null && (now.isAfter(activity.getEndTime()) || now.isEqual(activity.getEndTime()))) {
            return "finished";  // 已结束
        }

        if (activity.getStartTime() != null && (now.isAfter(activity.getStartTime()) || now.isEqual(activity.getStartTime()))) {
            return "ongoing";  // 进行中
        }

        return "published";  // 已发布（报名中或即将开始）
    }

    /**
     * 获取活动状态的中文描述
     *
     * @param activity 活动对象
     * @return 状态中文描述
     */
    public static String getActivityStatusText(Activity activity) {
        if (activity == null) {
            return "未知";
        }

        String status = calculateActivityStatus(activity);
        switch (status) {
            case "draft":
                return "草稿";
            case "pending":
                return "待发布";
            case "cancelled":
                return "已取消";
            case "finished":
                return "已结束";
            case "ongoing":
                return "进行中";
            case "published":
                if (isActivityUpcoming(activity)) {
                    return "即将开始";
                } else if (isActivityRegistering(activity)) {
                    return "报名中";
                } else {
                    return "已发布";
                }
            default:
                return "未知";
        }
    }

    /**
     * 验证活动是否可以进行签到
     *
     * @param activity 活动对象
     * @return 是否可以签到
     */
    public static boolean canCheckin(Activity activity) {
        if (activity == null || activity.getStartTime() == null || activity.getEndTime() == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        // 签到时间窗口：活动开始前30分钟到结束时间
        LocalDateTime checkinStartTime = activity.getStartTime().minusMinutes(30);

        return (now.isAfter(checkinStartTime) || now.isEqual(checkinStartTime))
            && now.isBefore(activity.getEndTime());
    }

    /**
     * 验证活动是否可以进行评价
     *
     * @param activity 活动对象
     * @return 是否可以评价
     */
    public static boolean canReview(Activity activity) {
        // 评价的条件：活动已结束
        return isActivityFinished(activity);
    }
}
