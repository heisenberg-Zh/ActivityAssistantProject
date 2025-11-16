package com.activityassistant.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 序列号生成器实体
 * 用于生成业务表的每日自增序列号
 */
@Entity
@Table(name = "sequence_generator",
       uniqueConstraints = @UniqueConstraint(columnNames = {"business_type", "date_key"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SequenceGenerator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 业务类型：activity/registration/checkin/message
     */
    @Column(name = "business_type", nullable = false, length = 20)
    private String businessType;

    /**
     * 日期键（YYYYMMDD格式）
     */
    @Column(name = "date_key", nullable = false, length = 8)
    private String dateKey;

    /**
     * 当前序列值
     */
    @Column(name = "current_value", nullable = false)
    private Integer currentValue;

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

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.currentValue == null) {
            this.currentValue = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
