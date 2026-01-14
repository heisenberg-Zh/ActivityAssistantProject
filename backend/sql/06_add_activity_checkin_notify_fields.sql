-- ============================================
-- 为 activities 表补充“是否需要签到/是否通知用户”字段
-- 版本: 1.2
-- 执行日期: 2026-01-08
-- 说明: 增加 need_checkin、notify_users，兼容已上线数据库的增量升级
-- ============================================

USE activity_assistant;

DELIMITER //

DROP PROCEDURE IF EXISTS add_activity_checkin_notify_fields //
CREATE PROCEDURE add_activity_checkin_notify_fields()
BEGIN
    -- need_checkin 字段
    IF NOT EXISTS (
        SELECT *
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'activity_assistant'
          AND TABLE_NAME = 'activities'
          AND COLUMN_NAME = 'need_checkin'
    ) THEN
        ALTER TABLE activities
            ADD COLUMN need_checkin TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否需要打卡签到'
            AFTER checkin_radius;
        SELECT 'Added column: need_checkin' AS result;
    ELSE
        SELECT 'Column need_checkin already exists' AS result;
    END IF;

    -- notify_users 字段
    IF NOT EXISTS (
        SELECT *
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'activity_assistant'
          AND TABLE_NAME = 'activities'
          AND COLUMN_NAME = 'notify_users'
    ) THEN
        ALTER TABLE activities
            ADD COLUMN notify_users TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否消息通知用户（系统内消息）'
            AFTER need_review;
        SELECT 'Added column: notify_users' AS result;
    ELSE
        SELECT 'Column notify_users already exists' AS result;
    END IF;
END //

DELIMITER ;

CALL add_activity_checkin_notify_fields();
DROP PROCEDURE IF EXISTS add_activity_checkin_notify_fields;

DESCRIBE activities;

SELECT '✅ 迁移完成：need_checkin / notify_users' AS status;

