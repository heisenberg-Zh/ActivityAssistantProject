package com.activityassistant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 活动评价实体类
 *
 * @author Claude
 * @since 2025-01-20
 */
@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_activity_id", columnList = "activity_id"),
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    /**
     * 评价ID（UUID）
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
     * 评价人ID
     */
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    /**
     * 评价人昵称（冗余存储，避免用户修改昵称后评价列表显示异常）
     */
    @Column(name = "user_name", length = 100)
    private String userName;

    /**
     * 评价人头像（冗余存储）
     */
    @Column(name = "user_avatar", length = 500)
    private String userAvatar;

    /**
     * 评分（1-5星）
     */
    @Column(name = "rating", nullable = false)
    private Integer rating;

    /**
     * 评价内容（最多500字）
     */
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    /**
     * 是否被管理员删除（软删除）
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * 删除原因（管理员删除时填写）
     */
    @Column(name = "delete_reason", length = 200)
    private String deleteReason;

    /**
     * 删除操作人ID（管理员ID）
     */
    @Column(name = "deleted_by", length = 36)
    private String deletedBy;

    /**
     * 删除时间
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间（用户修改评价时更新）
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 创建前自动设置创建时间
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    /**
     * 更新前自动设置更新时间
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
