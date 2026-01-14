package com.activityassistant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 用户反馈实体类
 *
 * @author Claude
 * @since 2025-01-22
 */
@Entity
@Table(name = "feedbacks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    /**
     * 反馈ID（主键）
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID（可选，允许匿名反馈）
     */
    @Column(name = "user_id", length = 36)
    private String userId;

    /**
     * 反馈内容
     */
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    /**
     * 联系方式（可选）
     */
    @Column(name = "contact_info", length = 200)
    private String contactInfo;

    /**
     * 反馈类型（可选：bug/suggestion/other）
     */
    @Column(name = "type", length = 50)
    private String type;

    /**
     * 处理状态（pending/processing/resolved/closed）
     */
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "pending";

    /**
     * 处理备注（仅系统管理员可见）
     */
    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    /**
     * 处理人用户ID（系统管理员）
     */
    @Column(name = "handled_by", length = 50)
    private String handledBy;

    /**
     * 处理时间（首次处理/状态变更时间）
     */
    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间（状态/备注变更）
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
