package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 活动统计视图对象
 *
 * @author Claude
 * @since 2025-11-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityStatisticsVO {

    /**
     * 活动ID
     */
    private String activityId;

    /**
     * 报名统计
     */
    private RegistrationStatsVO registrationStats;

    /**
     * 签到统计
     */
    private CheckinStatsVO checkinStats;

    /**
     * 分组统计
     */
    private List<GroupStatsVO> groupStats;

    /**
     * 报名统计内嵌类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegistrationStatsVO {
        /**
         * 总报名人数
         */
        private Long total;

        /**
         * 已通过人数
         */
        private Long approved;

        /**
         * 待审核人数
         */
        private Long pending;

        /**
         * 已取消人数
         */
        private Long cancelled;

        /**
         * 已拒绝人数
         */
        private Long rejected;
    }

    /**
     * 签到统计内嵌类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckinStatsVO {
        /**
         * 已签到人数
         */
        private Long total;

        /**
         * 迟到人数
         */
        private Long late;

        /**
         * 签到率（%）
         */
        private Double rate;

        /**
         * 无效签到人数（位置超出范围）
         */
        private Long invalid;
    }

    /**
     * 分组统计内嵌类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupStatsVO {
        /**
         * 分组ID
         */
        private String groupId;

        /**
         * 分组名称
         */
        private String name;

        /**
         * 已报名人数
         */
        private Long registered;

        /**
         * 已签到人数
         */
        private Long checkedin;
    }
}
