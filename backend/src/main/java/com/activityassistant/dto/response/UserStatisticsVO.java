package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户统计视图对象
 *
 * @author Claude
 * @since 2025-11-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatisticsVO {

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 用户昵称
     */
    private String nickname;

    /**
     * 创建的活动数
     */
    private Long createdActivities;

    /**
     * 参与的活动数
     */
    private Long participatedActivities;

    /**
     * 总报名数
     */
    private Long totalRegistrations;

    /**
     * 总签到数
     */
    private Long totalCheckins;

    /**
     * 签到率（%）
     */
    private Double checkinRate;

    /**
     * 迟到次数
     */
    private Long lateCount;

    /**
     * 无效签到次数
     */
    private Long invalidCheckinCount;
}
