-- ============================================
-- 创建收藏表 (favorites)
-- 说明：如果 favorites 表不存在则创建
-- ============================================

USE activity_assistant;

-- 创建收藏表
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '收藏ID（自增）',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    activity_id VARCHAR(36) NOT NULL COMMENT '活动ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',

    -- 外键约束
    CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorite_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,

    -- 唯一约束（同一用户不能重复收藏同一活动）
    UNIQUE KEY uk_user_activity (user_id, activity_id),

    -- 索引
    INDEX idx_user (user_id),
    INDEX idx_activity (activity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- 输出提示
SELECT 'favorites 表已创建或已存在' AS message;
