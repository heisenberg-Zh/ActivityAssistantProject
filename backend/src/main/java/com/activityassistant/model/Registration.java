package com.activityassistant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 报名实体类
 *
 * @author Claude
 * @since 2025-11-11
 */
@Entity
@Table(name = "registrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Registration {

    /**
     * 报名ID（UUID）
     */
    @Id
    @Column(name = "id", length = 36)
    private String id;

    /**
     * 活动ID
     */
    @Column(name = "activity_id", nullable = false, length = 36)
    private String activityId;

    /**
     * 分组ID（如果活动有分组）
     */
    @Column(name = "group_id", length = 50)
    private String groupId;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    /**
     * 报名姓名
     */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * 联系电话
     */
    @Column(name = "mobile", length = 20)
    private String mobile;

    /**
     * 自定义字段值（JSON）
     */
    @Column(name = "custom_data", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private String customData;

    /**
     * 报名状态：pending/approved/rejected/cancelled
     */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "pending";

    /**
     * 报名时间
     */
    @Column(name = "registered_at", nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    /**
     * 审核通过时间
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /**
     * 签到状态：pending/checked/late
     */
    @Column(name = "checkin_status", nullable = false, length = 20)
    @Builder.Default
    private String checkinStatus = "pending";

    /**
     * 签到时间
     */
    @Column(name = "checkin_time")
    private LocalDateTime checkinTime;

    /**
     * 持久化之前自动设置报名时间
     */
    @PrePersist
    protected void onCreate() {
        this.registeredAt = LocalDateTime.now();
    }
}
