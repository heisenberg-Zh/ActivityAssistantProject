package com.activityassistant.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 报名视图对象
 *
 * @author Claude
 * @since 2025-11-11
 */
@Data
@Builder
public class RegistrationVO {

    /**
     * 报名ID
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
     * 分组ID
     */
    private String groupId;

    /**
     * 分组名称
     */
    private String groupName;

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
     * 报名姓名
     */
    private String name;

    /**
     * 联系电话
     */
    private String mobile;

    /**
     * 自定义字段值（JSON字符串）
     */
    private String customData;

    /**
     * 报名状态
     */
    private String status;

    /**
     * 报名时间
     */
    private LocalDateTime registeredAt;

    /**
     * 审核通过时间
     */
    private LocalDateTime approvedAt;

    /**
     * 签到状态
     */
    private String checkinStatus;

    /**
     * 签到时间
     */
    private LocalDateTime checkinTime;
}
