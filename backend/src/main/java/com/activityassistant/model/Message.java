package com.activityassistant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 消息实体类
 *
 * @author Claude
 * @since 2025-01-22
 */
@Entity
@Table(name = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    /**
     * 消息ID（主键）
     */
    @Id
    @Column(name = "id", length = 36)
    private String id;

    /**
     * 接收用户ID
     */
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    /**
     * 消息类型（publish_success, publish_failed, activity_reminder, system等）
     */
    @Column(name = "type", nullable = false, length = 50)
    private String type;

    /**
     * 消息标题
     */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * 消息内容
     */
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    /**
     * 关联活动ID（可选）
     */
    @Column(name = "activity_id", length = 36)
    private String activityId;

    /**
     * 是否已读
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
