package com.activityassistant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 活动实体类
 *
 * @author Claude
 * @since 2025-11-10
 */
@Entity
@Table(name = "activities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Activity {

    /**
     * 活动ID（UUID）
     */
    @Id
    @Column(name = "id", length = 36)
    private String id;

    /**
     * 活动标题
     */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * 活动简介（简短描述）
     */
    @Column(name = "desc", length = 500)
    private String desc;

    /**
     * 活动描述（详细说明）
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 报名要求
     */
    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    /**
     * 组织者ID
     */
    @Column(name = "organizer_id", nullable = false, length = 36)
    private String organizerId;

    /**
     * 组织者联系电话
     */
    @Column(name = "organizer_phone", length = 20)
    private String organizerPhone;

    /**
     * 组织者微信号
     */
    @Column(name = "organizer_wechat", length = 50)
    private String organizerWechat;

    /**
     * 活动封面图片URL
     */
    @Column(name = "image", length = 500)
    private String image;

    /**
     * 是否启用分组
     */
    @Column(name = "has_groups", nullable = false)
    @Builder.Default
    private Boolean hasGroups = false;

    /**
     * 活动类型：运动/聚会/培训/户外
     */
    @Column(name = "type", length = 50)
    private String type;

    /**
     * 活动状态：pending/published/ongoing/finished/cancelled
     */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "pending";

    /**
     * 开始时间
     */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    /**
     * 报名截止时间
     */
    @Column(name = "register_deadline")
    private LocalDateTime registerDeadline;

    /**
     * 地点名称
     */
    @Column(name = "place", length = 200)
    private String place;

    /**
     * 详细地址
     */
    @Column(name = "address", length = 500)
    private String address;

    /**
     * 纬度
     */
    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    /**
     * 经度
     */
    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    /**
     * 签到范围（米）
     */
    @Column(name = "checkin_radius", nullable = false)
    @Builder.Default
    private Integer checkinRadius = 500;

    /**
     * 总人数上限
     */
    @Column(name = "total", nullable = false)
    private Integer total;

    /**
     * 已报名人数
     */
    @Column(name = "joined", nullable = false)
    @Builder.Default
    private Integer joined = 0;

    /**
     * 最小人数
     */
    @Column(name = "min_participants", nullable = false)
    @Builder.Default
    private Integer minParticipants = 1;

    /**
     * 费用
     */
    @Column(name = "fee", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal fee = BigDecimal.ZERO;

    /**
     * 费用类型：free/AA/uniform
     */
    @Column(name = "fee_type", nullable = false, length = 20)
    @Builder.Default
    private String feeType = "free";

    /**
     * 是否需要审核
     */
    @Column(name = "need_review", nullable = false)
    @Builder.Default
    private Boolean needReview = false;

    /**
     * 是否公开（0=私密活动）
     */
    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = true;

    /**
     * 是否删除（软删除）
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * 分组数据（JSON）
     */
    @Column(name = "`groups`", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String groups;

    /**
     * 管理员列表（JSON）
     */
    @Column(name = "administrators", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String administrators;

    /**
     * 白名单（JSON）
     */
    @Column(name = "whitelist", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String whitelist;

    /**
     * 黑名单（JSON）
     */
    @Column(name = "blacklist", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String blacklist;

    /**
     * 活动级自定义字段（JSON）
     */
    @Column(name = "custom_fields", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String customFields;

    /**
     * 定时发布时间
     */
    @Column(name = "scheduled_publish_time")
    private LocalDateTime scheduledPublishTime;

    /**
     * 实际发布时间
     */
    @Column(name = "actual_publish_time")
    private LocalDateTime actualPublishTime;

    /**
     * 是否周期性活动
     */
    @Column(name = "is_recurring", nullable = false)
    @Builder.Default
    private Boolean isRecurring = false;

    /**
     * 周期性活动组ID
     */
    @Column(name = "recurring_group_id", length = 36)
    private String recurringGroupId;

    /**
     * 周期配置（JSON）
     */
    @Column(name = "recurring_config", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String recurringConfig;

    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 持久化之前自动设置创建时间和更新时间
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * 更新之前自动设置更新时间
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
