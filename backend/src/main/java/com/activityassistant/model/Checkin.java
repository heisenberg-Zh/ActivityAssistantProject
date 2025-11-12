package com.activityassistant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 签到实体类
 *
 * @author Claude
 * @since 2025-11-11
 */
@Entity
@Table(name = "checkins")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Checkin {

    /**
     * 签到ID（UUID）
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
     * 用户ID
     */
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    /**
     * 报名记录ID
     */
    @Column(name = "registration_id", nullable = false, length = 36)
    private String registrationId;

    /**
     * 签到纬度
     */
    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    /**
     * 签到经度
     */
    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    /**
     * 签到地址
     */
    @Column(name = "address", length = 500)
    private String address;

    /**
     * 距离活动地点的距离（米）
     */
    @Column(name = "distance")
    private Integer distance;

    /**
     * 签到时间
     */
    @Column(name = "checkin_time", nullable = false)
    private LocalDateTime checkinTime;

    /**
     * 是否迟到
     */
    @Column(name = "is_late", nullable = false)
    @Builder.Default
    private Boolean isLate = false;

    /**
     * 是否有效（位置验证）
     */
    @Column(name = "is_valid", nullable = false)
    @Builder.Default
    private Boolean isValid = true;

    /**
     * 备注（如：距离超出范围）
     */
    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    /**
     * 在持久化之前设置签到时间
     */
    @PrePersist
    protected void onCreate() {
        if (this.checkinTime == null) {
            this.checkinTime = LocalDateTime.now();
        }
    }
}
