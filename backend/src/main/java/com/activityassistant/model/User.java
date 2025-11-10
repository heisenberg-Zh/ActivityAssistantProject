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
 * 用户实体类
 *
 * @author Claude
 * @since 2025-01-08
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /**
     * 用户ID（主键）
     */
    @Id
    @Column(name = "id", length = 50)
    private String id;

    /**
     * 微信OpenID
     */
    @Column(name = "open_id", unique = true, nullable = false, length = 100)
    private String openid;

    /**
     * 微信UnionID（可选）
     */
    @Column(name = "union_id", length = 100)
    private String unionid;

    /**
     * 用户昵称
     */
    @Column(name = "nickname", length = 100)
    private String nickname;

    /**
     * 头像URL
     */
    @Column(name = "avatar", length = 500)
    private String avatar;

    /**
     * 手机号（数据库字段名为mobile）
     */
    @Column(name = "mobile", length = 20)
    private String phone;

    /**
     * 用户角色（user=普通用户，admin=管理员）
     */
    @Column(name = "role", length = 20, nullable = false)
    @Builder.Default
    private String role = "user";

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
