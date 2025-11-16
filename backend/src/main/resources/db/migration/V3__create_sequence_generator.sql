-- ============================================
-- 序列号生成器表
-- 用途：为各业务表生成每日自增序列号
-- ============================================

CREATE TABLE IF NOT EXISTS sequence_generator (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    business_type VARCHAR(20) NOT NULL COMMENT '业务类型：activity/registration/checkin/message',
    date_key VARCHAR(8) NOT NULL COMMENT '日期键（YYYYMMDD）',
    current_value INT NOT NULL DEFAULT 0 COMMENT '当前序列值',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_business_date (business_type, date_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='序列号生成器表';

-- 创建索引
CREATE INDEX idx_business_type ON sequence_generator(business_type);
CREATE INDEX idx_date_key ON sequence_generator(date_key);

-- 初始化各业务类型的序列（可选）
INSERT INTO sequence_generator (business_type, date_key, current_value) VALUES
('activity', DATE_FORMAT(NOW(), '%Y%m%d'), 0),
('registration', DATE_FORMAT(NOW(), '%Y%m%d'), 0),
('checkin', DATE_FORMAT(NOW(), '%Y%m%d'), 0),
('message', DATE_FORMAT(NOW(), '%Y%m%d'), 0)
ON DUPLICATE KEY UPDATE current_value = current_value;
