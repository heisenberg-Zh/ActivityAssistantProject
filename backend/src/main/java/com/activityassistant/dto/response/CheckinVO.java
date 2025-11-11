package com.activityassistant.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 签到视图对象
 *
 * @author Claude
 * @since 2025-11-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckinVO {

    /**
     * 签到ID
     */
    private String id;

    /**
     * 活动ID
     */
    private String activityId;

    /**
     * 活动标题
     */
    private String activityTitle;

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 用户昵称
     */
    private String userNickname;

    /**
     * 用户头像
     */
    private String userAvatar;

    /**
     * 报名记录ID
     */
    private String registrationId;

    /**
     * 报名姓名
     */
    private String registrationName;

    /**
     * 签到纬度
     */
    private BigDecimal latitude;

    /**
     * 签到经度
     */
    private BigDecimal longitude;

    /**
     * 签到地址
     */
    private String address;

    /**
     * 距离活动地点的距离（米）
     */
    private Integer distance;

    /**
     * 签到时间
     */
    private LocalDateTime checkinTime;

    /**
     * 是否迟到
     */
    private Boolean isLate;

    /**
     * 是否有效（位置验证）
     */
    private Boolean isValid;

    /**
     * 备注
     */
    private String note;
}
