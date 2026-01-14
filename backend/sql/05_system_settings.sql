-- ============================================
-- ActivityAssistant 系统配置表（system_settings）
-- 说明：用于存放小程序/系统级开关配置
-- 创建日期: 2026-01-07
-- ============================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) NOT NULL COMMENT '配置项Key',
  setting_value VARCHAR(200) NOT NULL COMMENT '配置项Value',
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 兼容：如果表已存在但 updated_at 没有默认值/自动更新（常见于历史建表或JPA自动建表），修正为带默认值
ALTER TABLE system_settings
  MODIFY COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6);

-- 默认配置：创建活动仅管理员可创建（0=关闭；1=开启）
INSERT INTO system_settings (setting_key, setting_value, updated_at)
VALUES ('create_activity_admin_only', '0', CURRENT_TIMESTAMP(6))
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  updated_at = CURRENT_TIMESTAMP(6);

-- ============================================
-- 常用开关脚本（按需执行）
-- ============================================
-- 开启：创建活动仅管理员可创建
-- UPDATE system_settings SET setting_value = '1' WHERE setting_key = 'create_activity_admin_only';
--
-- 关闭：创建活动不做管控
-- UPDATE system_settings SET setting_value = '0' WHERE setting_key = 'create_activity_admin_only';

