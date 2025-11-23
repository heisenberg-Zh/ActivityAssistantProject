package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 收藏响应VO
 *
 * @author Claude
 * @since 2025-01-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteVO {

    /**
     * 收藏ID
     */
    private Long id;

    /**
     * 活动ID
     */
    private String activityId;

    /**
     * 活动标题
     */
    private String activityTitle;

    /**
     * 活动描述
     */
    private String activityDescription;

    /**
     * 活动类型
     */
    private String activityType;

    /**
     * 活动状态
     */
    private String activityStatus;

    /**
     * 活动开始时间
     */
    private String startTime;

    /**
     * 活动结束时间
     */
    private String endTime;

    /**
     * 地点
     */
    private String place;

    /**
     * 组织者ID
     */
    private String organizerId;

    /**
     * 组织者昵称
     */
    private String organizerName;

    /**
     * 已报名人数
     */
    private Integer joined;

    /**
     * 总人数上限
     */
    private Integer total;

    /**
     * 收藏时间
     */
    private String createdAt;
}
