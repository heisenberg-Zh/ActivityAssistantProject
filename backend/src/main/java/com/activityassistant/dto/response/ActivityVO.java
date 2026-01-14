package com.activityassistant.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 活动视图对象
 *
 * @author Claude
 * @since 2025-11-10
 */
@Data
@Builder
public class ActivityVO {

    /**
     * 活动ID
     */
    private String id;

    /**
     * 活动标题
     */
    private String title;

    /**
     * 活动简介（简短描述）
     */
    private String desc;

    /**
     * 活动描述（详细说明/活动说明及注意事项）
     */
    private String description;

    /**
     * 报名要求
     */
    private String requirements;

    /**
     * 组织者ID
     */
    private String organizerId;

    /**
     * 组织者昵称
     */
    private String organizerName;

    /**
     * 组织者头像
     */
    private String organizerAvatar;

    /**
     * 组织者联系电话
     */
    private String organizerPhone;

    /**
     * 组织者微信号
     */
    private String organizerWechat;

    /**
     * 活动封面图片URL
     */
    private String image;

    /**
     * 是否启用分组
     */
    private Boolean hasGroups;

    /**
     * 活动类型
     */
    private String type;

    /**
     * 活动状态
     */
    private String status;

    /**
     * 开始时间
     */
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    private LocalDateTime endTime;

    /**
     * 报名截止时间
     */
    private LocalDateTime registerDeadline;

    /**
     * 地点名称
     */
    private String place;

    /**
     * 详细地址
     */
    private String address;

    /**
     * 纬度
     */
    private BigDecimal latitude;

    /**
     * 经度
     */
    private BigDecimal longitude;

    /**
     * 签到范围（米）
     */
    private Integer checkinRadius;

    /**
     * 是否需要打卡签到
     */
    private Boolean needCheckin;

    /**
     * 总人数上限
     */
    private Integer total;

    /**
     * 已报名人数
     */
    private Integer joined;

    /**
     * 最小人数
     */
    private Integer minParticipants;

    /**
     * 费用
     */
    private BigDecimal fee;

    /**
     * 费用类型
     */
    private String feeType;

    /**
     * 是否需要审核
     */
    private Boolean needReview;

    /**
     * 是否消息通知用户
     */
    private Boolean notifyUsers;

    /**
     * 是否公开
     */
    private Boolean isPublic;

    /**
     * 是否已删除
     */
    private Boolean isDeleted;

    /**
     * 分组数据（JSON字符串）
     */
    private String groups;

    /**
     * 管理员列表
     */
    private List<UserSimpleVO> administrators;

    /**
     * 白名单（JSON字符串）
     */
    private String whitelist;

    /**
     * 黑名单（JSON字符串）
     */
    private String blacklist;

    /**
     * 自定义字段（JSON字符串）
     */
    private String customFields;

    /**
     * 定时发布时间
     */
    private LocalDateTime scheduledPublishTime;

    /**
     * 实际发布时间
     */
    private LocalDateTime actualPublishTime;

    /**
     * 是否周期性活动
     */
    private Boolean isRecurring;

    /**
     * 周期配置（JSON字符串）
     */
    private String recurringConfig;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 当前用户是否为组织者
     */
    private Boolean isOrganizer;

    /**
     * 当前用户是否为管理员
     */
    private Boolean isAdmin;

    /**
     * 当前用户是否已报名
     */
    private Boolean isRegistered;
}
